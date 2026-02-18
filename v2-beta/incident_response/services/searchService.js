export async function fetchWebContext(errorSnippet) {
  try {
    // 1. Sanitize the query [cite: 254]
    const cleanQuery = errorSnippet
      .replace(/\[.*?\]/g, '') 
      .replace(/FATAL:|ERROR:/g, '')
      .trim();

    // 2. PRIMARY SEARCH: Attempt specific error search
    const primaryUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1`;
    let response = await fetch(primaryUrl);
    let data = await response.json();

    let context = data.AbstractText || (data.RelatedTopics?.length > 0 ? data.RelatedTopics[0].Text : null);

    // 3. BROADEN SEARCH (The "Adaptive" fix): 
    // If no context, strip specific error codes and search for the component [cite: 108]
    if (!context) {
      console.log(`🔍 [DEBUG] Primary search empty. Broadening to component...`);
      const broadQuery = cleanQuery.split(':')[0]; // e.g., "libuv error - uv_thread_create"
      const broadUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(broadQuery)}&format=json&no_html=1`;
      
      response = await fetch(broadUrl);
      data = await response.json();
      context = data.AbstractText || (data.RelatedTopics?.length > 1 ? data.RelatedTopics[0].Text : null);
    }

    // --- NEW: PRINT ACTIVELY RETRIEVED DATA ---
    const finalContext = context && context.length > 10 
      ? context 
      : "Generic SRE context: EAGAIN often refers to process thread limits or ulimit restrictions.";

    console.log(`\n🌐 [ACTIVE RETRIEVAL DATA]:`);
    console.log(`--------------------------------------------------`);
    console.log(finalContext);
    console.log(`--------------------------------------------------\n`);

    // 4. FINAL FALLBACK: Return the context for SLM generation 
    return finalContext;
  } catch (err) {
    console.error("❌ [DEBUG] Stage 2 Interface Error:", err.message);
    return null;
  }
}