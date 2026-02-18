import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

async function runActiveRetrievalTest() {
  const causalStory = [
    "INFO: System boot complete. Node.js v18.16.0",
    "INFO: Thread pool initialized with UV_THREADPOOL_SIZE=4",
    "WARN: High event loop lag detected: 450ms", 
    "INFO: Handling 2500 concurrent crypto.pbkdf2 requests",
    "WARN: Worker thread synchronization delay > 2s",
    "ERROR: Thread pool saturation: 4/4 threads blocked", 
    "INFO: Attempting to spawn fallback worker...",
    // 🚨 THIS IS THE TRIGGER: Obscure error to force Active Retrieval
    "FATAL: libuv error - uv_thread_create: EAGAIN (resource temporarily unavailable)", 
  ];

  console.log("🔥 Screamer: Injecting obscure 'libuv thread pool' failure...");
  
  for (const log of causalStory) {
    // Add timestamp to match your server's expectations
    const timestampedLog = `[${new Date().toISOString()}] ${log}`;
    await client.rPush(CONFIG.redis.listName, timestampedLog);
    
    // Tiny delay to simulate real-time ingestion
    await new Promise(r => setTimeout(r, 20));
  }

  console.log("✅ Injection complete. Check Ops-Sentinel logs for 'Live Research' trigger.");
  await client.quit();
}

runActiveRetrievalTest();