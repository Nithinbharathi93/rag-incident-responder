import { createClient } from 'redis';
import { CONFIG } from './config.js';
import { supabase } from './supabaseClient.js';
import { getEmbedding, getChatResponse, generateSearchTags } from './controllers/aiController.js';

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
    // 1. Generate search tags based on the incident
    const searchTags = await generateSearchTags(forensicStory);
    const tagsArray = Array.isArray(searchTags) ? searchTags : [searchTags];
    console.log(`\n🔍 Searching documentation with tags: ${tagsArray.join(', ')}`);

    // 2. Vectorize the crash line (last line in story)
    const crashLine = forensicStory[forensicStory.length - 1];
    const queryEmbedding = await getEmbedding(crashLine);

    // 3. Search Supabase for relevant documentation
    const { data: matches, error } = await supabase.rpc('match_document_chunks_with_tags', {
      query_embedding: queryEmbedding,
      match_threshold: 0.2,
      match_count: 3,
      filter_tags: tagsArray
    });

    if (error) {
      console.warn(`⚠️ RAG search error: ${error.message}`);
      matches = [];
    }

    // 4. Generate solution using LLM with grounding
    const solution = await getChatResponse(
      forensicStory.join("\n"),
      matches ? matches.map(m => m.content) : []
    );

    return {
      solution,
      tagsUsed: tagsArray,
      sources: matches ? [...new Set(matches.map(m => m.metadata.source))] : [],
      documentMatches: matches ? matches.length : 0
    };
  } catch (error) {
    console.error(`❌ RAG resolution error: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 3: Main integration loop
 * Continuously monitors Redis buffer, extracts forensic data, and resolves with RAG
 */
export async function initializeIntegrationHandler() {
  try {
    await redisClient.connect();
    console.log("✅ Connected to Redis");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    process.exit(1);
  }

  // Start monitoring
  console.log("\n🚀 Final Responder Integration Handler Active...\n");
  
  setInterval(async () => {
    try {
      const forensicData = await extractForensicStory();
      
      if (forensicData) {
        console.log(`\n╔════════════════════════════════════════════════════════╗`);
        console.log(`║           🚨 INCIDENT DETECTED & ANALYZED              ║`);
        console.log(`╚════════════════════════════════════════════════════════╝`);
        console.log(`\n📝 Forensic Story (${forensicData.story.length} critical events):`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        forensicData.story.forEach((line, idx) => {
          // Extract level from log line
          let icon = "📋";
          if (line.toUpperCase().includes("FATAL")) icon = "💥";
          else if (line.toUpperCase().includes("ERROR")) icon = "❌";
          else if (line.toUpperCase().includes("WARN")) icon = "⚠️";
          else if (line.toUpperCase().includes("INFO")) icon = "ℹ️";
          
          // Truncate long logs for readability
          const displayLine = line.length > 110 
            ? line.substring(0, 107) + "..." 
            : line;
          
          console.log(`  ${idx + 1}. ${icon} ${displayLine}`);
        });

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Resolve with RAG
        const resolution = await resolveIncidentWithRAG(forensicData.story);
        
        console.log(`\n💡 RAG Resolution Analysis:`);
        console.log(`   🏷️  Tags: ${resolution.tagsUsed.join(', ')}`);
        console.log(`   📚 Documentation matches: ${resolution.documentMatches}`);
        if (resolution.sources.length > 0) {
          console.log(`   📖 Sources: ${resolution.sources.join(', ')}`);
        }
        console.log(`\n📋 Recommended Solution:`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(resolution.solution);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        // Clean up resolved logs from buffer
        await cleanupResolvedLogs(forensicData.logsToRemove);
        
        console.log(`\n✅ Incident resolution complete, buffer cleaned\n`);
      }
    } catch (error) {
      console.error(`❌ Integration error: ${error.message}`);
    }
  }, CONFIG.buffer.releaseRateMs);
}

export async function shutdownHandler() {
  await redisClient.quit();
  console.log("\n✅ Integration handler shutdown complete");
}
