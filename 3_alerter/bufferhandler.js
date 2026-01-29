import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

// Keywords that trigger our "Sentinel" 
const WATCHLIST = ["ERROR", "FAIL", "ECONNREFUSED", "EOLERR", "BufferError"];

async function processBuffer() {
  console.log(`🛡️ Stage 3 Sentinel: Monitoring logs at 1 log/sec...`);

  const interval = setInterval(async () => {
    // Pop the oldest log (FIFO)
    const logLine = await client.lPop(CONFIG.redis.listName);

    if (logLine) {
      // Check if the log is "Noise" or an "Incident"
      const isIncident = WATCHLIST.some(keyword => logLine.includes(keyword));

      if (isIncident) {
        console.log(`🚨 [INCIDENT DETECTED]: ${logLine}`);
        // This is where Stage 4 will eventually call for "Back-up" logs
      } else {
        console.log(`⚪ [NOISE IGNORED]: ${logLine.substring(0, 40)}...`);
      }
      
    } else {
      console.log("📭 Buffer empty. All clear.");
    }
  }, CONFIG.buffer.releaseRateMs);
}

processBuffer();