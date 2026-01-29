import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

async function scream() {
  console.log("🔥 Screamer started: Pumping logs into Redis...");

  // Example of a "Causal Chain" log sequence
  const logs = [
    { level: 'INFO', message: 'System heartbeat normal', timestamp: new Date() },
    { level: 'WARN', message: 'DB query latency increased by 200ms', timestamp: new Date() },
    { level: 'ERROR', message: "Cache write failed for key 'user_session_99'", timestamp: new Date() },
    { level: 'FATAL', message: "OOM command not allowed when used memory > 'maxmemory'", timestamp: new Date() }
  ];

  for (const log of logs) {
    // We use LPUSH to push to the head of the list
    await client.lPush(CONFIG.redis.listName, JSON.stringify(log));
    
    // Maintain the sliding window size in Redis automatically
    await client.lTrim(CONFIG.redis.listName, 0, CONFIG.buffer.historyWindowSize - 1);
    
    console.log(`📤 Pushed: [${log.level}] ${log.message}`);
    // Small delay to simulate real-world arrival
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("✅ Sequence complete.");
  process.exit();
}

scream();