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

  console.log("vecorized crash line.");

  // 3. Filtered Vector Search
const { data: matches, error } = await supabase.rpc('match_document_chunks_with_tags', {
    query_embedding: queryEmbedding,
    match_threshold: 0.05, // EXTREMELY LOW for testing
    match_count: 5,
    filter_tags: tagsArray
});

console.log("completed vector search.");

  if (error) throw error;

  // 4. Grounded Generation
  const solution = await getChatResponse(
    `Incident Story:\n${forensicStory.join("\n")}`,
    matches ? matches.map(m => m.content) : []
  );

  console.log("obtained grounded response.");


  return { 
    solution, 
    tagsUsed: searchTags,
    sources: matches ? [...new Set(matches.map(m => m.metadata.source))] : [] 
  };
}