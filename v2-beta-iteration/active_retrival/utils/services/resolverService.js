import axios from 'axios';
import { scrapeDocument } from '../utils/scraper.js';

/**
 * Extracts the core error message from a raw stack trace.
 */
function buildSearchQuery(errorMsg, stack) {
    // The first line of a stack trace is usually the most searchable
    const firstLineOfStack = stack ? stack.split('\n')[0].trim() : '';
    const query = errorMsg || firstLineOfStack;
    
    // Clean out app-specific paths (e.g., /usr/src/app/server.js:12:4) to improve search hits
    return query.replace(/(\/[^\/]+)+\.js:\d+:\d+/g, '').trim();
}

/**
 * Queries the internet (StackOverflow via API) and scrapes the top results.
 */
export async function findResolvingDocuments(error, stack) {
    const query = buildSearchQuery(error, stack);
    console.log(`[Resolver] Formulated Search Query: "${query}"`);

    try {
        // 1. Search the internet (Using StackExchange API as our proxy for "The Internet")
        const searchUrl = `https://api.stackexchange.com/2.3/search/advanced`;
        const { data } = await axios.get(searchUrl, {
            params: {
                order: 'desc',
                sort: 'relevance',
                q: query,
                site: 'stackoverflow',
                pagesize: 3 // Get top 3 results
            }
        });

        if (!data.items || data.items.length === 0) {
            return { message: "No resolving documents found for this error." };
        }

        const urlsToScrape = data.items.map(item => item.link);
        console.log(`[Resolver] Found URLs to scrape:`, urlsToScrape);

        // 2. Scrape the targeted documents concurrently
        const scrapePromises = urlsToScrape.map(async (url) => {
            const content = await scrapeDocument(url);
            return {
                sourceUrl: url,
                content: content || "Content could not be extracted."
            };
        });

        const documents = await Promise.all(scrapePromises);

        return {
            searchQuery: query,
            results: documents
        };

    } catch (err) {
        console.error('[Resolver] Search/Scrape failed:', err.message);
        throw new Error('Failed to fetch resolving documents.');
    }
}