import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

async function processBuffer() {
  console.log(`🛡️ BufferHandler: Monitoring ${CONFIG.redis.listName}...`);

  const interval = setInterval(async () => {
    // Pop the oldest log from the head of the list (FIFO)
    const logLine = await client.lPop(CONFIG.redis.listName);

    if (logLine) {
      console.log(`📤 [RELEASED]: ${logLine}`);
      
      // Stage 3 Logic will go here: 
      // if (logLine.includes("ERROR")) { ... }
    } else {
      console.log("📭 Buffer empty. Waiting for logs...");
      // Optional: Clear interval if you want it to stop after 200 lines
    }
  }, CONFIG.buffer.releaseRateMs);
}

processBuffer();