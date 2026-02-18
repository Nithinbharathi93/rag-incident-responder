import { createClient } from 'redis';
import { CONFIG } from './config.js';
import { supabase } from './supabaseClient.js';
import { getEmbedding, getChatResponse } from './controllers/aiController.js';
import { fetchWebContext } from './services/searchService.js';

const redisClient = createClient();
const ALPHA_THRESHOLD = 0.7; // 

export async function resolveWithAdaptiveRAG(forensicStory) {
  const crashLine = forensicStory[forensicStory.length - 1];
  console.log(`\n🕵️ Analyzing Trigger: ${crashLine}`);
  
  const queryEmbedding = await getEmbedding(crashLine);

  // --- STAGE 1: PASSIVE RETRIEVAL (Internal DB) --- [cite: 110]
  const { data: matches } = await supabase.rpc('match_document_chunks_with_tags', {
    query_embedding: queryEmbedding,
    match_threshold: 0.1, // Low threshold to capture and log the actual score
    match_count: 1
  });

  const topMatch = matches?.[0];
  const similarityScore = topMatch ? topMatch.similarity : 0.0;

  let context = null;
  let retrievalType = "";

  // --- THE SWITCH LOGIC --- 
  if (similarityScore >= ALPHA_THRESHOLD) {
    console.log(`✅ STAGE 1 SUCCESS: Internal Match found with score ${similarityScore.toFixed(2)}`);
    context = topMatch.content;
    retrievalType = "PASSIVE_INTERNAL";
  } 
  else {
    // --- STAGE 2: ACTIVE RETRIEVAL (Agentic Fallback) --- [cite: 126, 128]
    console.log(`⚠️ STAGE 1 FAIL: Score ${similarityScore.toFixed(2)} < ${ALPHA_THRESHOLD}. Switching to ACTIVE RETRIEVAL...`);
    
    // Scrape external documents from authoritative sources [cite: 127]
    const webData = await fetchWebContext(crashLine);
    
    if (webData) {
      console.log(`🌐 STAGE 2 SUCCESS: Scraped external context.`);
      context = webData;
      retrievalType = "ACTIVE_WEB";
    } else {
      console.log(`❌ STAGE 2 FAIL: No external data found.`);
      context = "No specific documentation found for this error.";
      retrievalType = "NONE";
    }
  }

  // Generate solution using the context (if any) [cite: 131]
  const solution = await getChatResponse(forensicStory.join("\n"), [context]);

  return {
    solution,
    score: similarityScore,
    method: retrievalType,
    trigger: crashLine
  };
}