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
   name: "Memory Leak and GC Pressure",
    logs: [
      "INFO [11:00:00] Node.js Heap: 250 MB / 2 GB max, GC interval: 50s",
      "INFO [11:00:10] WebSocket connection manager initialized, max connections: 10,000",
      "INFO [11:05:20] Active connections: 2,340, memory per connection: ~0.8 MB",
      "WARN [11:15:30] Heap size increased to 600 MB, GC pause time: 120ms",
      "INFO [11:25:40] Cumulative connected clients: 4,200, heap: 950 MB",
      "WARN [11:35:50] Heap size: 1.3 GB (65% of max), GC pause times increasing: 200ms, 240ms, 180ms",
      "WARN [11:45:00] High GC frequency: 5 collections in last minute, avg pause: 210ms",
      "WARN [11:55:10] Heap fragmentation detected: 42% of heap is unreachable memory",
      "ERROR [12:05:20] GC overhead limit exceeded: 98% of CPU time spent in garbage collection",
      "WARN [12:15:30] Memory growth trend: +50 MB every 10 minutes, estimated OOM in 35 minutes",
      "ERROR [12:25:40] Unable to allocate buffer: cannot allocate 128 MB block, heap limit approaching",
      "WARN [12:30:00] Event loop lag detected: max 3.5s, application unresponsive",
      "FATAL [12:35:15] FATAL: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory (1924 MB)"
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