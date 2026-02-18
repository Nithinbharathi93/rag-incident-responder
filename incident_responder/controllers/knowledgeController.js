/**
 * SELF-LEARNING: Automatically saves a web-found solution to your local Supabase RAG.
 */
async function autoIngestSolution(error, solution) {
  const embedding = await getEmbedding(error);
  
  await supabase.from('documents').insert({
    content: `AUTO-LEARNED PLAYBOOK\nERROR: ${error}\nSOLUTION: ${solution}`,
    metadata: { source: "Sentinel-Intelligence", tag: "auto-resolved", learned_at: new Date() },
    embedding: embedding
  });
  
  console.log("💾 Knowledge Base Updated: Sentinel has learned a new fix.");
}