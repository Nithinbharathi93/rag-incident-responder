/**
 * DEPRECATED: Web fetching feature has been removed.
 * The system now uses only existing ingested documents for incident resolution.
 * 
 * This file is retained for reference but the fetchWebContext function
 * is no longer used. The RAG system relies solely on documents
 * injected via the /ingest endpoint.
 */

// Legacy code removed - use document ingestion instead
export async function fetchWebContext(errorSnippet) {
  throw new Error("fetchWebContext has been deprecated. Use only ingested documents.");
}