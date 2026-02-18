import axios from 'axios';
import * as cheerio from 'cheerio';

const OFFICIAL_SOURCES = {
    "node": "https://nodejs.org/api/errors.html",
    "express": "https://expressjs.com/en/guide/error-handling.html",
    "react": "https://react.dev/reference/react/errors",
    "typescript": "https://www.typescriptlang.org/docs/handbook/error-checking.html"
};

export const getFullErrorDocs = async (stack) => {
    const url = OFFICIAL_SOURCES[stack.toLowerCase()];
    if (!url) throw new Error(`Error documentation for '${stack}' is not mapped.`);

    try {
        // Fetch the HTML
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Define common documentation containers (Node uses #apicontent, others use <main> or <article>)
        const selectors = [
            '#apicontent', 
            'main', 
            'article', 
            '.content', 
            '#content',
            '.docs-content'
        ];

        let fullContent = "";

        // Loop through selectors until we find the one the site uses
        for (const selector of selectors) {
            const element = $(selector);
            if (element.length > 0) {
                // Remove noise like "Edit on GitHub" buttons or sidebars if they are inside
                element.find('nav, footer, script, style, .edit-page-link').remove();
                fullContent = element.text().trim();
                break;
            }
        }

        if (!fullContent) {
            // Fallback: If no container matches, just get the body text
            fullContent = $('body').text().trim();
        }

        return {
            source: url,
            // Clean up excessive whitespace and newlines for a readable response
            document: fullContent.replace(/\n\s*\n/g, '\n\n') 
        };
    } catch (err) {
        throw new Error(`Failed to retrieve full document: ${err.message}`);
    }
};