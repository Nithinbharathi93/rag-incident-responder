import { createClient } from 'redis';
import axios from 'axios';
import { CONFIG } from './config.js';

const client = createClient();
client.on('error', err => console.error('Redis Client Error', err));
await client.connect();

const LIST_NAME = "ops_sentinel_buffer";
const RAG_SERVICE_URL = "http://localhost:3001/resolve";

console.log("🕵️ Ops-Sentinel Observer is watching for FATAL logs...");

async function processLogs() {
    while (true) {
        // BLPOP waits for data, so it won't peg your CPU
        const { element } = await client.blPop(LIST_NAME, 0);
        const logEntry = JSON.parse(element);

        async function callRAG(forensicStory, retries = 2) {
        try {
            const response = await axios.post(RAG_SERVICE_URL, {
                story: forensicStory
            }, { timeout: 90000 });
            return response.data;
        } catch (error) {
            if (retries > 0 && (error.code === 'ECONNABORTED' || error.response?.status === 503)) {
                console.warn(`⚠️ AI Service busy. Retrying in 5 seconds... (${retries} retries left)`);
                await new Promise(res => setTimeout(res, 5000));
                return callRAG(forensicStory, retries - 1);
            }
            throw error;
        }
    }

        if (logEntry.level === 'FATAL') {
            console.log("\n🚨 FATAL ERROR DETECTED. Constructing forensic timeline...");
            
            // 1. Retrieve the sliding window context from Redis
            // Assuming your Redis list keeps the last X entries
            const rawContext = await client.lRange(LIST_NAME, 0, 10); 
            const forensicStory = rawContext.map(l => JSON.parse(l).message).reverse();

            // 2. Send to RAG Microservice
            try {
                const data = await callRAG(forensicStory);
                console.log("\n━━━━━━━ 🤖 OPS-SENTINEL RESOLUTION ━━━━━━━");
                console.log(`DIAGNOSIS & FIX: \n${data.solution}`);
                console.log(`\nTAGS IDENTIFIED: ${data.tagsUsed.join(', ')}`);
                console.log(`SOURCES: ${data.sources.join(', ')}`);
                console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
                
            } catch (err) {
                console.error("❌ Failed to reach RAG Service after retries.");
            }
        }
    }
}

processLogs();