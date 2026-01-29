import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

const WATCHLIST = ["ERROR", "FAIL", "ECONNREFUSED", "EOLERR", "BufferError"];
const HISTORY_KEY = "ops_sentinel_history";

async function processBuffer() {
  console.log(`🛡️ Stage 4.1: Sentinel with Sliding Window (${CONFIG.buffer.historyWindowSize} logs)`);

  setInterval(async () => {
    // 1. Pop the oldest log from the main buffer
    const logLine = await client.lPop(CONFIG.redis.listName);

    if (logLine) {
      // 2. Add this log to our "Rolling History"
      await client.lPush(HISTORY_KEY, logLine);
      // 3. Trim history so it only keeps the last X lines
      await client.lTrim(HISTORY_KEY, 0, CONFIG.buffer.historyWindowSize - 1);

      // 4. Check for Incident
      const isIncident = WATCHLIST.some(keyword => logLine.includes(keyword));

      if (isIncident) {
        // 5. CAPTURE THE WINDOW: Grab the previous logs from Redis
        const context = await client.lRange(HISTORY_KEY, 0, -1);
        
        console.log(`\n🚨 [INCIDENT DETECTED]: ${logLine}`);
        console.log(`📸 [WINDOW SNAPSHOT]:`);
        // Reverse to show in chronological order
        context.reverse().forEach((line, i) => {
          const prefix = i === context.length - 1 ? "  👉 ERROR:" : "  | ";
          console.log(`${prefix} ${line}`);
        });
        console.log(`------------------------------------------\n`);
      } else {
        console.log(`⚪ [PROCESSING]: ${logLine.substring(0, 50)}...`);
      }
    }
  }, CONFIG.buffer.releaseRateMs);
}

processBuffer();