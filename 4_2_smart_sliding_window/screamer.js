import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

async function runScenario() {
  const causalStory = [
    "INFO: User 101 logged in",
    "INFO: Heartbeat: CPU 2%",
    "WARN: Garbage Collection taking longer than 500ms", // SIGNAL (The Cause)
    "INFO: Request handled: /api/data",
    "INFO: Heartbeat: CPU 4%",
    "WARN: Heap usage at 88% - Approaching limit",      // SIGNAL (The Build-up)
    "INFO: User 105 logged in",
    "WARN: Heap usage at 95% - Critical pressure",      // SIGNAL (The Build-up)
    "INFO: Database connection stable",
    "FATAL ERROR: JavaScript heap out of memory"        // SIGNAL (The Final Crash)
  ];

  console.log("🎬 Screamer: Injecting noise + causal signals...");
  for (const log of causalStory) {
    await client.rPush(CONFIG.redis.listName, `[${new Date().toISOString()}] ${log}`);
  }
  await client.quit();
}

runScenario();