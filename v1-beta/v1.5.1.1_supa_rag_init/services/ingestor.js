import { supabase } from "../supabaseClient.js";
import { getEmbedding } from "../controllers/aiController.js";
import { extractTextFromPDF, chunkText } from "../utils/textExtractor.js";

export async function ingestDocument(fileBuffer, fileName) {
  const text = await extractTextFromPDF(fileBuffer);
  const chunks = await chunkText(text);

  // Simple Tag Forging Logic
  const tags = [];
  if (fileName.toLowerCase().includes("node")) tags.push("nodejs");
  if (fileName.toLowerCase().includes("k8s") || fileName.toLowerCase().includes("kube")) tags.push("kubernetes");

  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);
    
    // Add content-based tags too
    const localTags = [...tags];
    if (chunk.includes("memory")) localTags.push("memory");
    if (chunk.includes("network")) localTags.push("network");

    await supabase.from("document_chunks").insert({
      content: chunk,
      embedding: embedding,
      metadata: { 
        source: fileName,
        tags: localTags // Now storing tags in JSONB
      }
    });
  }
}