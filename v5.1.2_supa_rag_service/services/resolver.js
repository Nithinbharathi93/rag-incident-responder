import { supabase } from "../supabaseClient.js";
import { getEmbedding, getChatResponse, generateSearchTags } from "../controllers/aiController.js";

export async function resolveIncident(forensicStory) {
  // 1. Semantic Tag Detection
  const searchTags = await generateSearchTags(forensicStory);
  const tagsArray = Array.isArray(searchTags) ? searchTags : [searchTags];
  console.log(`🔍 Searching with tags: ${searchTags.join(', ')}`);

  // 2. Vectorization of the last line (the crash)
  const crashLine = forensicStory[forensicStory.length - 1];
  const queryEmbedding = await getEmbedding(crashLine);

  // 3. Filtered Vector Search
const { data: matches, error } = await supabase.rpc('match_document_chunks_with_tags', {
    query_embedding: queryEmbedding,
    match_threshold: 0.2, // Lower this temporarily to ensure a match
    match_count: 3,
    filter_tags: tagsArray
});

  if (error) throw error;

  // 4. Grounded Generation
  const solution = await getChatResponse(
    `Incident Story:\n${forensicStory.join("\n")}`,
    matches ? matches.map(m => m.content) : []
  );

  return { 
    solution, 
    tagsUsed: searchTags,
    sources: matches ? [...new Set(matches.map(m => m.metadata.source))] : [] 
  };
}