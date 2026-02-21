import { supabase } from "../supabaseClient.js";
import { getEmbedding, generateTags } from "../controllers/aiController.js";
import { extractTextFromPDF, chunkText } from "../utils/textExtractor.js";

export async function ingestDocument(fileBuffer, fileName) {
  const text = await extractTextFromPDF(fileBuffer);
  const chunks = await chunkText(text);

  // Use the first chunk to "profile" the document and get global tags
  const autoTags = await generateTags(chunks[0]);
  console.log(`🏷️ Auto-generated tags for ${fileName}: ${autoTags.join(', ')}`);

  for (const chunk of chunks) {
    const embedding = await getEmbedding(chunk);
    
    await supabase.from("document_chunks").insert({
      content: chunk,
      embedding: embedding,
      metadata: { 
        source: fileName,
        tags: autoTags // Every chunk gets the document's auto-generated tags
      }
    });
  }
}

// Add this function to ingestor.js
export async function ingestManualEntry(solution, source, tags, forensicStory) {
  // We embed the STORY (the problem), not the solution
  const searchableText = Array.isArray(forensicStory) ? forensicStory.join("\n") : forensicStory;
  const embedding = await getEmbedding(searchableText);
  
  const { error } = await supabase.from("document_chunks").insert({
    content: searchableText, // This matches incoming logs
    embedding: embedding,
    metadata: { 
      source: source,
      tags: tags,
      saved_solution: solution, // This is what we display
      is_verified: true 
    }
  });

  if (error) throw error;
  console.log(`🧠 KB Updated: Anchored solution to log pattern.`);
}