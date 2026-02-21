import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const PORT = 3000;

// 1. FORMATTER: Clean HTML and handle the &nbsp; and link clutter
function formatSolution(html) {
    return html
        .replace(/<a [^>]*>([^<]+)<\/a>/gi, '$1') 
        .replace(/&nbsp;/g, ' ')
        .replace(/&gt;/g, '>')  // Fixes >
        .replace(/&lt;/g, '<')  // Fixes <
        .replace(/&amp;/g, '&') // Fixes &
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

// 2. SEARCH LOGIC: Rejecting wrong platforms
async function getBwsSolution(rawLog, metadata = []) {
    const queries = [
        rawLog.replace(/\[.*?\]/g, '').replace(/\b\d+\b/g, '').replace(/[:()-]/g, '').trim(),
        `Linux kernel "Out of memory" kill process`, // Forced 'Linux' keyword
        `Ubuntu server OOM killer fix`
    ];

    for (let q of queries) {
        const params = new URLSearchParams({ order: 'desc', sort: 'relevance', q: q, site: 'stackoverflow' });
        const res = await fetch(`https://api.stackexchange.com/2.3/search/advanced?${params}`);
        const data = await res.json();

        if (data.items?.length > 0) {
            for (let i = 0; i < Math.min(data.items.length, 5); i++) {
                const solution = await processBestAnswer(data.items[i]);
                
                // QUALITY CHECK: Must have code AND shouldn't be about WSL (Windows)
                if (solution && !solution.startsWith("❌") && solution.includes('`')) {
                    if (solution.toLowerCase().includes('wsl') || solution.toLowerCase().includes('windows')) {
                        console.log(`⏩ Skipping WSL/Windows solution in Thread #${i}`);
                        continue; 
                    }
                    return solution;
                }
            }
        }
    }
    return "❌ No platform-appropriate solutions found.";
}

async function processBestAnswer(bestQuestion) {
    const url = `https://api.stackexchange.com/2.3/questions/${bestQuestion.question_id}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items?.length) return "❌ No answers";

    for (let answer of data.items) {
        if (answer.body.includes('<pre>') || answer.body.includes('<code>')) {
            return formatSolution(answer.body);
        }
    }
    return "❌ No code blocks";
}

app.post('/active-retrieval', async (req, res) => {
    const { error, metadata } = req.body;
    const solution = await getBwsSolution(error, metadata || []);
    res.json({ success: true, proper_solution: solution });
});

app.listen(PORT, () => console.log(`🚀 BWS Active Retrieval Server running on ${PORT}`));