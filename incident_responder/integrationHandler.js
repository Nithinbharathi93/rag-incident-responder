import { createClient } from 'redis';
import { CONFIG } from './config.js';
import { supabase } from './supabaseClient.js';
import { getEmbedding, getChatResponse, generateSearchTags } from './controllers/aiController.js';
import { fetchStackOverflowSolution } from './services/externalRetrievalService.js';

const redisClient = createClient({
  host: CONFIG.redis.host,
  port: CONFIG.redis.port
});

const HISTORY_KEY = "final_responder_history";

/**
 * PHASE 1: Extract forensic story from logs (Screamer + Buffer Handler)
 * Returns: Array of error lines with causal chain + history indices for cleanup
 */
export async function extractForensicStory() {
  const logLine = await redisClient.lPop(CONFIG.redis.listName);
  if (!logLine) return null;

  // Maintain rolling history
  await redisClient.lPush(HISTORY_KEY, logLine);
  await redisClient.lTrim(HISTORY_KEY, 0, CONFIG.buffer.historyWindowSize - 1);

  // Check if this is a CRITICAL event (case-insensitive for complex logs)
  const isCritical = CONFIG.buffer.severity.CRITICAL.some(s => 
    logLine.toUpperCase().includes(s.toUpperCase())
  );

  if (!isCritical) {
    process.stdout.write("·");
    return null;
  }

  // Extract the forensic chain
  const fullHistory = await redisClient.lRange(HISTORY_KEY, 0, -1);
  
  // Find the first causal signal by searching backwards
  let pivotIndex = -1;
  for (let i = 0; i < fullHistory.length; i++) {
    if (CONFIG.buffer.causalSignals.some(signal => 
      fullHistory[i].toUpperCase().includes(signal.toUpperCase())
    )) {
      pivotIndex = i;
    }
  }

  let forensicStory = [];
  let logsToRemove = [];

  if (pivotIndex !== -1) {
    // Build the causal chain: from cause to crash, filtered for signals only
    const allChainLogs = fullHistory.slice(0, pivotIndex + 1).reverse();
    forensicStory = allChainLogs.filter(line => {
      const isSignal = [...CONFIG.buffer.severity.CRITICAL, ...CONFIG.buffer.severity.ERROR, ...CONFIG.buffer.causalSignals]
        .some(keyword => line.toUpperCase().includes(keyword.toUpperCase()));
      return isSignal;
    });
    logsToRemove = allChainLogs; // Store all logs in chain for cleanup
  } else {
    // Isolated crash
    forensicStory = [logLine];
    logsToRemove = [logLine];
  }

  return {
    story: forensicStory,
    logsToRemove: logsToRemove,
    timestamp: new Date().toISOString()
  };
}

/**
 * PHASE 2.5: Clean up resolved logs from Redis history
 * Removes the resolved logs from both the history and main buffer
 */
async function cleanupResolvedLogs(logsToRemove) {
  try {
    if (!logsToRemove || logsToRemove.length === 0) return;

    // Remove logs from the history
    for (const log of logsToRemove) {
      await redisClient.lRem(HISTORY_KEY, 1, log);
    }

    console.log(`🧹 Cleaned up ${logsToRemove.length} resolved logs from buffer`);
  } catch (error) {
    console.error(`⚠️ Cleanup error: ${error.message}`);
  }
}

/**
 * PHASE 2: Resolve incident using RAG service
 * Takes forensic story and returns AI-generated solution
 */
export async function resolveIncidentWithRAG(forensicStory) {
  try {
    const crashLine = forensicStory[forensicStory.length - 1];
    const queryEmbedding = await getEmbedding(crashLine);
    
    // 1. STAGE 1: Passive Retrieval (Internal KB)
    const { data: matches } = await supabase.rpc('match_document_chunks_with_tags', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, 
      match_count: 3
    });

    const topMatch = matches && matches.length > 0 ? matches[0] : null;
    const confidenceScore = topMatch ? topMatch.similarity : 0;

    let contextSources = [];
    let tagsUsed = ["internal-docs"];

    // Populate context from internal docs if they exist
    if (matches && matches.length > 0) {
      console.log(`✅ Internal Match Found (Score: ${confidenceScore.toFixed(2)})`);
      contextSources = matches.map(m => m.content);
    }

    // 2. STAGE 2: Active Retrieval (External Fallback)
    // Threshold check: If internal docs are weak (< 0.5 similarity), fetch from Stack Overflow
    if (confidenceScore < 0.5) {
      console.log(`📡 Low internal confidence (${confidenceScore.toFixed(2)}). Triggering Active Retrieval...`);
      
      // Generate search tags using your AI controller
      const searchTags = await generateSearchTags(forensicStory);
      
      // Fetch the high-quality answer from Stack Overflow
      const externalKnowledge = await fetchStackOverflowSolution(crashLine, searchTags);

      if (externalKnowledge) {
        console.log("🌐 External Knowledge successfully retrieved from Stack Overflow");
        contextSources.push(`EXTERNAL KNOWLEDGE (Stack Overflow):\n${externalKnowledge}`);
        tagsUsed.push("external-web", ...searchTags);
      } else {
        console.log("⚠️ No suitable external solution found.");
      }
    }

    // 3. Generate Solution using Hybrid Context
    const solution = await getChatResponse(
      forensicStory.join("\n"),
      contextSources
    );

    return {
      solution,
      tagsUsed: tagsUsed,
      sources: matches && matches.length > 0 ? [...new Set(matches.map(m => m.metadata.source))] : [],
      documentMatches: contextSources.length,
      confidence: confidenceScore
    };
  } catch (error) {
    console.error(`❌ RAG Error: ${error.message}`);
    throw error;
  }
}

// ... existing imports ...

/**
 * PHASE 3: Main integration loop
 * @param {Function} broadcastFn - The function from server.js to push live incident updates
 * @param {Function} broadcastBacklogFn - The function from server.js to push backlog updates
 */
export async function initializeIntegrationHandler(broadcastFn, broadcastBacklogFn) {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    process.exit(1);
  }

  const pendingIncidents = [];
  let activeSessions = 0;
  const MAX_CONCURRENT_SESSIONS = 5; // Adjust based on your CPU/GPU cores

  // ========== FAST FETCH LOOP (Unchanged) ==========
  setInterval(async () => {
    const forensicData = await extractForensicStory();
    if (forensicData) pendingIncidents.push(forensicData);
  }, 50);

  // ========== CONCURRENT ANALYSIS LOOP ==========
  setInterval(async () => {
    // Fill up available sessions until we hit the limit
    while (activeSessions < MAX_CONCURRENT_SESSIONS && pendingIncidents.length > 0) {
      const forensicData = pendingIncidents.shift();
      
      activeSessions++; // Claim a session
      
      // We run the analysis in an IIFE so it doesn't block the loop
      (async (data) => {
        try {
          const queueDepth = await redisClient.lLen(CONFIG.redis.listName);
          console.log(`\n🚀 Session ${activeSessions} Started | Backlog: ${queueDepth}`);

          const resolution = await resolveIncidentWithRAG(data.story);
          console.log(`\n📋 RAG RESPONSE:\n${resolution.solution}\n`);
          
          const incidentPayload = {
            type: 'LIVE_INCIDENT',
            solution: resolution.solution,
            tags: resolution.tagsUsed,
            sources: resolution.sources,
            matchesFound: resolution.documentMatches,
            forensicStory: data.story,
            backlog: queueDepth,
            timestamp: new Date().toISOString()
          };
          
          broadcastFn(incidentPayload);
          console.log(`📡 Solution broadcasted to frontend`);

          await cleanupResolvedLogs(data.logsToRemove);
        } catch (err) {
          console.error(`❌ Session Error: ${err.message}`);
        } finally {
          activeSessions--; // Release session back to the pool
          console.log(`✅ Session Released. Remaining Active: ${activeSessions}`);
        }
      })(forensicData); 
    }
  }, 100); // Check for available sessions every 100ms
}

// ... rest of the file ...

export async function shutdownHandler() {
  await redisClient.quit();
  console.log("\n✅ Integration handler shutdown complete");
}


