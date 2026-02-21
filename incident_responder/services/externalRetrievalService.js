import fetch from 'node-fetch';

// Helper to turn HTML into a readable "Playbook" style for your AI context
function formatSolution(html) {
    return html
        .replace(/<a [^>]*>([^<]+)<\/a>/gi, '$1') 
        .replace(/&nbsp;/g, ' ')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<li>/g, '  • ')
        .replace(/<\/li>/g, '\n')
        .replace(/<code>/g, '`')
        .replace(/<\/code>/g, '`')
        .replace(/<pre>/g, '\n---\n')
        .replace(/<\/pre>/g, '\n---\n')
        .trim();
}

/**
 * Searches Stack Overflow for a code-based solution
 */
export async function fetchStackOverflowSolution(errorLog, tags = []) {
    // 1. Clean the log for the search query
    const cleanQuery = errorLog
        .replace(/\[.*?\]/g, '')               
        .replace(/\b\d+\b/g, '')               
        .replace(/[:()-]/g, '')
        .trim();

    // 2. Build the search queries (Specific -> Broad)
    const queries = [
        `${cleanQuery} ${tags.join(' ')}`,
        `Linux kernel ${cleanQuery}`,
        `site:stackoverflow.com ${cleanQuery.split(' ').slice(0, 4).join(' ')}`
    ];

    for (let q of queries) {
        try {
            const params = new URLSearchParams({
                order: 'desc', sort: 'relevance', q: q, site: 'stackoverflow'
            });

            const res = await fetch(`https://api.stackexchange.com/2.3/search/advanced?${params}`);
            const data = await res.json();

            if (data.items?.length > 0) {
                // Check top 3 questions for a valid answer
                for (let i = 0; i < Math.min(data.items.length, 3); i++) {
                    const ansId = data.items[i].accepted_answer_id || await getTopAnswerId(data.items[i].question_id);
                    if (!ansId) continue;

                    const ansRes = await fetch(`https://api.stackexchange.com/2.3/answers/${ansId}?site=stackoverflow&filter=withbody`);
                    const ansData = await ansRes.json();
                    
                    const body = ansData.items?.[0]?.body;
                    if (body && (body.includes('<pre>') || body.includes('<code>'))) {
                        return formatSolution(body);
                    }
                }
            }
        } catch (e) { console.error("SO Fetch Error:", e.message); }
    }
    return null;
}

async function getTopAnswerId(questionId) {
    const res = await fetch(`https://api.stackexchange.com/2.3/questions/${questionId}/answers?order=desc&sort=votes&site=stackoverflow`);
    const data = await res.json();
    return data.items?.[0]?.answer_id || null;
}