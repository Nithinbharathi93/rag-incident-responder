import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Fetches a URL and extracts the main text content, stripping out noise.
 * @param {string} url - The URL to scrape.
 * @returns {Promise<string>} - The extracted text.
 */
export async function scrapeDocument(url) {
    try {
        const { data } = await axios.get(url, {
            // Mimic a standard browser to avoid basic blocks
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            timeout: 5000 // Don't hang the incident response on a slow site
        });

        const $ = cheerio.load(data);

        // Remove noise: scripts, styles, navs, headers, footers
        $('script, style, nav, header, footer, iframe, noscript').remove();

        // Extract raw text and condense whitespace
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim();
        
        // Return a truncated version to prevent massive payloads
        return cleanText.substring(0, 3000) + '... [TRUNCATED]';
    } catch (error) {
        console.error(`[Scraper] Failed to fetch ${url}:`, error.message);
        return null;
    }
}