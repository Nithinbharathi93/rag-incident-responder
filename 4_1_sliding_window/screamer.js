import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

const LOG_LEVELS = ["INFO", "DEBUG", "WARN", "ERROR"];
const ERROR_MESSAGES = ["ECONNREFUSED: Database failed", "TypeError: undefined id", "EOLERR: Stream break"];

async function startScreaming() {
  console.log(`🚀 Screamer: Pushing ${CONFIG.screamer.totalLogs} logs to Redis...`);

  for (let i = 0; i < CONFIG.screamer.totalLogs; i++) {
    const isError = Math.random() > 0.95;
    const level = isError ? "ERROR" : LOG_LEVELS[Math.floor(Math.random() * 3)];
    const msg = isError ? ERROR_MESSAGES[Math.floor(Math.random() * 3)] : "System heartbeat";
    const logLine = `[${new Date().toISOString()}] ${level}: ${msg} (Log #${i+1})`;

    // Push to the tail of the Redis List
    await client.rPush(CONFIG.redis.listName, logLine);
  }

  console.log("✅ All logs pushed. Screamer shutting down.");
  await client.quit();
}

startScreaming();