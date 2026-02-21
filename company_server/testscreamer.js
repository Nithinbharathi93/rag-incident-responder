import { createClient } from 'redis';
import { CONFIG } from './config.js';

/**
 * 🛠️ SINGLE INCIDENT INJECTOR
 * Injects one forensic story into the buffer and exits.
 */
async function injectSingleIncident() {
  const client = createClient({
    url: `redis://${CONFIG.redis.host}:${CONFIG.redis.port}`
  });

  try {
    await client.connect();
    console.log("🔗 Connected to Redis for test injection...");

    const testScenario = {
      name: "Memory Exhaustion - Redis OOM",
      logs: [
        "INFO [14:22:01] Server startup: Node.js v18.16.0, PID=4521",
        "INFO [14:22:15] Session cache initialized, TTL: 3600s",
        "WARN [14:25:42] Redis memory usage: 85% (7.15 GB / 8.4 GB)",
        "WARN [14:27:15] Redis memory usage: 92% (7.73 GB / 8.4 GB), eviction policy: allkeys-lru",
        "ERROR [14:28:12] Redis: MISCONF Redis is configured to save RDB snapshots",
        "ERROR [14:29:01] Cache write failed for key 'user_batch_checkpoint_1': OOM command not allowed",
        "WARN [14:29:15] Queue backpressure detected: 12,000 jobs pending",
        "ERROR [14:29:45] Failed to write session data: Redis OOM, rejecting write commands",
        "FATAL [14:30:12] Service degradation: FATAL - READONLY You can't write against a read only replica"
      ]
    };

    console.log(`🚀 Injecting Scenario: ${testScenario.name}`);

    for (const log of testScenario.logs) {
      await client.rPush(CONFIG.redis.listName, log);
      console.log(`  ➡️  Pushed: ${log}`);
      // Minimal delay to simulate real-time ingestion
      await new Promise(r => setTimeout(r, 50));
    }

    console.log("\n✅ Injection complete. The Integration Handler should now pick this up.");
  } catch (error) {
    console.error("❌ Injection failed:", error);
  } finally {
    await client.quit();
  }
}

injectSingleIncident();