import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

async function runScenario() {
  const causalStory = [
    "INFO: User 101 logged in",
    "INFO: Heartbeat: CPU 2%",
    "WARN: DB query latency increased by 200ms", // SIGNAL (The Cause)
    "INFO: Request handled: /api/data",
    "INFO: Heartbeat: CPU 4%",
    "ERROR: Cache write failed for key 'user_session_99'",      // SIGNAL (The Build-up)
    "INFO: User 105 logged in",
    "INFO: Database connection stable",
    "FATAL: OOM command not allowed when used memory > 'maxmemory'",       // SIGNAL (The Final Crash)
  ];

  console.log("🎬 Screamer: Injecting noise + causal signals...");
  for (const log of causalStory) {
    await client.rPush(CONFIG.redis.listName, `[${new Date().toISOString()}] ${log}`);
  }
  await client.quit();
}

runScenario();