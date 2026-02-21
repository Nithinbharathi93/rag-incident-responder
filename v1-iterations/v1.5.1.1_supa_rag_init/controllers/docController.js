import { supabase } from "../supabaseClient.js";

/**
 * Fetches a unique list of all ingested documents and their source filenames.
 */
export async function listDocuments() {
  try {
    // We query the document_chunks table and use a 'select' trick to get unique sources
    const { data, error } = await supabase
      .from("document_chunks")
      .select("metadata->source")
      .order("id", { ascending: false });

    if (error) throw error;

    // Filter for unique filenames
    const uniqueDocs = [...new Set(data.map(item => item.source))];
    return uniqueDocs;
  } catch (err) {
    console.error("List Documents Error:", err.message);
    throw new Error("Failed to retrieve document list.");
  }
}

/**
 * Removes all chunks associated with a specific document filename.
 * Use this if you need to update a manual.
 */
export async function deleteDocument(fileName) {
  try {
    const { error } = await supabase
      .from("document_chunks")
      .delete()
      .eq('metadata->>source', fileName);

    if (error) throw error;
    console.log(`🗑️ Successfully deleted all chunks for: ${fileName}`);
    return true;
  } catch (err) {
    console.error("Delete Document Error:", err.message);
    return false;
  }
}