import express from 'express';
import { createClient } from 'redis';
import { CONFIG } from './config.js';
import { resolveWithAdaptiveRAG } from './integrationHandler.js';
import { getEmbedding, getChatResponse } from './controllers/aiController.js';
import { supabase } from './supabaseClient.js';
import { fetchWebContext } from './services/searchService.js';

const app = express();
const client = createClient();
await client.connect();

const ALPHA_THRESHOLD = 0.7; // As defined in paper section III-B [cite: 126]
const connectedClients = new Set();

/**
 * CORE LOGIC: THE TWO-STAGE ADAPTIVE RAG
 */
async function performAdaptiveRAG(forensicStory) {
  const crashLine = forensicStory[forensicStory.length - 1];
  console.log(`\n🕵️ NEW INCIDENT DETECTED: ${crashLine}`);
  
  const queryEmbedding = await getEmbedding(crashLine);

  // --- STAGE 1: PASSIVE RETRIEVAL (Internal DB) ---
  const { data: matches } = await supabase.rpc('match_document_chunks_with_tags', {
    query_embedding: queryEmbedding,
    match_threshold: 0.1, 
    match_count: 1
  });

  const topMatch = matches?.[0];
  const similarityScore = topMatch ? topMatch.similarity : 0.0;

  let context = null;
  let method = "";

  // Switch logic [cite: 126]
  if (similarityScore >= ALPHA_THRESHOLD) {
    console.log(`✅ STAGE 1 SUCCESS: Found match (Score: ${similarityScore.toFixed(2)})`);
    context = topMatch.content;
    method = "PASSIVE_INTERNAL";
  } 
  else {
    console.log(`⚠️ STAGE 1 FAIL: Confidence ${similarityScore.toFixed(2)} < ${ALPHA_THRESHOLD}. Switching to ACTIVE RETRIEVAL...`);
    
    // --- STAGE 2: ACTIVE RETRIEVAL (Agentic Fallback) ---
    const webData = await fetchWebContext(crashLine);
    
    if (webData) {
      console.log(`🌐 STAGE 2 SUCCESS: Scraped external technical documentation.`);
      console.log(`🔍 Retrieved Context: ${webData}`); // Log a snippet of the context
      context = webData;
      method = "ACTIVE_WEB";
    } else {
      console.log(`❌ STAGE 2 FAIL: No external data found.`);
      context = "Unknown error signature. No existing documentation found.";
      method = "FAILED";
    }
  }

  // Final Generation [cite: 131]
  const solution = await getChatResponse(forensicStory.join("\n"), [context]);

  return { solution, score: similarityScore, method, contextFound: !!context };
}
    
// SSE Endpoint for Live Updates [cite: 138]
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();
  connectedClients.add(res);
  console.log("🔌 Dashboard connected");
  req.on('close', () => connectedClients.delete(res));
});

// Main Monitoring Loop [cite: 82]
async function startMonitoring() {
  console.log("🛡️ Ops-Sentinel Demo Server: Active and Monitoring Redis...");
  
  while (true) {
    const log = await client.lPop(CONFIG.redis.listName);
    
    if (log && log.includes("FATAL")) {
      // Create a simplified forensic story for the demo
      const story = ["WARN: Thread pool saturation: 4/4 threads blocked", log];
      
      const result = await performAdaptiveRAG(story);
      
      const payload = { ...result, timestamp: new Date().toISOString() };
      connectedClients.forEach(c => c.write(`data: ${JSON.stringify(payload)}\n\n`));
      console.log(`📡 Resolution broadcasted. Method: ${result.method}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }
}

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
  startMonitoring();
});