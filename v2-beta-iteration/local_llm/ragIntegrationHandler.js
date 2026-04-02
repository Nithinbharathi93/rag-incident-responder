import { supabase } from './supabaseClient.js';
import { getEmbedding, getChatResponse, generateSearchTags } from './localAiController.js';
import { fetchStackOverflowSolution } from './services/externalRetrievalService.js';

/**
 * PHASE 2: Resolve incident using Hybrid RAG
 * TARGETS: Internal SR of 92.5%, Latency < 1.3s.
 */
export async function resolveIncidentWithRAG(forensicStory) {
  try {
    // A. Generate rich context for search
    const searchTags = await generateSearchTags(forensicStory);
    const queryText = forensicStory.slice(-5).join("\n");
    const queryEmbedding = await getEmbedding(queryText);
    
    // B. STAGE 1: Documentation Search (Supabase)
    const { data: matches } = await supabase.rpc('match_document_chunks_with_tags', {
      query_embedding: queryEmbedding,
      match_threshold: 0.05, 
      match_count: 5,
      filter_tags: searchTags 
    });

    const topMatch = matches && matches.length > 0 ? matches[0] : null;
    const confidenceScore = topMatch ? topMatch.similarity : 0;

    let contextSources = [];
    if (matches && matches.length > 0) {
      console.log(`✅ Documentation Match (Score: ${confidenceScore.toFixed(2)})`);
      contextSources = matches.map(m => m.content);
    }

    // C. STAGE 2: Emergency External Fallback
    // Triggered only if documentation confidence is below the glimmer of hope threshold.
    if (contextSources.length === 0) {
      console.log(`📡 INTERNAL SEARCH FAILED. Emergency Web Retrieval...`);
      const crashLine = forensicStory[forensicStory.length - 1];
      const externalKnowledge = await fetchStackOverflowSolution(crashLine, searchTags);
      if (externalKnowledge) contextSources.push(externalKnowledge);
    }

    // D. Final Generation (Ollama)
    const solution = await getChatResponse(forensicStory.join("\n"), contextSources);

    return {
      solution,
      tagsUsed: searchTags,
      sources: matches?.length > 0 ? [...new Set(matches.map(m => m.metadata.source))] : ["External"],
      confidence: confidenceScore,
      path: matches?.length > 0 ? "Path 2 (Internal)" : "Path 3 (Agentic Web)"
    };
  } catch (error) {
    console.error(`❌ RAG Module Error: ${error.message}`);
    throw error;
  }
}