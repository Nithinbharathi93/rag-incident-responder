/**
 * FREE RESEARCHER: Fetches documentation from the web using 
 * DuckDuckGo's free interface (no API key required).
 */
export async function fetchWebContext(errorSnippet) {
  try {
    // Target high-authority SRE sites specifically
    const query = encodeURIComponent(`${errorSnippet} site:stackoverflow.com OR site:github.com OR site:docs.microsoft.com`);
    const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(url);
    const data = await response.json();

    // Combine Abstract and Related Topics for context
    let context = data.AbstractText || "";
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      context += "\n" + data.RelatedTopics.slice(0, 3).map(t => t.Text).join("\n");
    }

    return context.length > 10 ? context : null;
  } catch (err) {
    console.error("🌐 Web Research Failed:", err.message);
    return null;
  }
}