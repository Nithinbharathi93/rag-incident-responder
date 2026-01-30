import { supabase } from "../supabaseClient.js";
import { getEmbedding, getChatResponse } from "../controllers/aiController.js";

export async function resolveIncident(forensicStory) {
  const crashLine = forensicStory[forensicStory.length - 1];
  
  // 1. Forge tags based on the crash line
  const filterTags = [];
  if (crashLine.toLowerCase().includes("heap") || crashLine.toLowerCase().includes("memory")) filterTags.push("memory");
  if (crashLine.toLowerCase().includes("node")) filterTags.push("nodejs");
  
  const queryEmbedding = await getEmbedding(crashLine);

  // 2. Call the NEW Tag-Filtered RPC
  const { data: matches } = await supabase.rpc('match_document_chunks_with_tags', {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,
    match_count: 3,
    filter_tags: filterTags.length > 0 ? filterTags : ["SRE"] // Default tag
  });

  const solution = await getChatResponse(
    forensicStory.join("\n"),
    matches ? matches.map(m => m.content) : []
  );

  return { solution, sources: matches ? matches.map(m => m.metadata.source) : [] };
}