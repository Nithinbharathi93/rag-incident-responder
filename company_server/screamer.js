import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

// Complex realistic incident scenarios
const incidents = [
  {
    name: "Memory Exhaustion - Redis OOM",
    logs: [
      "INFO [14:22:01] Server startup: Node.js v18.16.0, PID=4521",
      "INFO [14:22:03] Connected to PostgreSQL 13.10 (primary), connection pool size: 20",
      "INFO [14:22:05] Redis Cluster connected: 6 nodes, version 7.0.5",
      "INFO [14:22:10] API Gateway listening on :3000, enabling rate limiter",
      "INFO [14:22:15] Session cache initialized, TTL: 3600s",
      "WARN [14:25:42] Redis memory usage: 85% (7.15 GB / 8.4 GB)",
      "INFO [14:26:01] User batch import job started, processing 50,000 records",
      "WARN [14:27:15] Redis memory usage: 92% (7.73 GB / 8.4 GB), eviction policy: allkeys-lru",
      "WARN [14:27:45] Session cache hit rate dropped from 94% to 71%, possible memory pressure",
      "ERROR [14:28:12] Redis: MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist on disk",
      "WARN [14:28:45] PostgreSQL connection pool: 18/20 connections active, queue depth: 5",
      "ERROR [14:29:01] Cache write failed for key 'user_batch_checkpoint_1': OOM command not allowed",
      "WARN [14:29:15] Queue backpressure detected: 12,000 jobs pending in 'process_payments' queue",
      "ERROR [14:29:45] Failed to write session data: Redis OOM, rejecting write commands",
      "FATAL [14:30:12] Service degradation: FATAL - READONLY You can't write against a read only replica"
    ]
  },
  {
    name: "Database Connection Pool Exhaustion",
    logs: [
      "INFO [09:15:00] Database pool initialized: min=5, max=20, idle timeout=30s",
      "INFO [09:15:05] Load balancer health check OK, routing traffic to 4 instances",
      "INFO [09:20:15] Background job processor started, workers=8",
      "WARN [09:35:22] Database connection pool at 90% utilization (18/20 active)",
      "INFO [09:35:45] Report generation job scheduled for monthly analytics (1000 queries)",
      "WARN [09:36:10] Connection pool: 19/20 active, 1 connection pending (waited 2.3s)",
      "WARN [09:36:45] PostgreSQL slow query log: SELECT took 8.5s (threshold: 2s)",
      "ERROR [09:37:01] Failed to acquire database connection: timeout after 30s, pool exhausted",
      "WARN [09:37:15] API response time degraded: p95=5.2s, p99=12.1s",
      "ERROR [09:37:45] Transaction rolled back: connection timeout during INSERT batch operation",
      "WARN [09:38:00] Background job queue backing up: 250 jobs waiting for worker slot",
      "ERROR [09:38:30] Cascading failure: Unable to execute critical health check query, marking node unhealthy",
      "FATAL [09:39:00] Cannot connect to primary database: ECONNREFUSED 10.0.1.50:5432 (all 20 connections lost)"
    ]
  },
  {
    name: "Disk Space and Logging Cascade",
    logs: [
      "INFO [16:40:00] Log rotation service initialized, retention: 30 days",
      "INFO [16:40:05] Disk usage check: /data partition 72% full (720 GB / 1 TB)",
      "INFO [16:45:30] Batch processing job started: 500k records to transform",
      "WARN [16:47:15] Disk usage increased to 85% (850 GB / 1 TB), cleanup triggered",
      "INFO [16:48:00] Old logs rotated: 45 GB freed",
      "WARN [16:49:45] Log flush queue backing up: 1.2 million events pending write",
      "WARN [16:50:30] Disk I/O latency spike: p99 write latency = 2450ms (threshold: 500ms)",
      "WARN [16:51:00] Disk usage: 91% (910 GB / 1 TB), approaching critical threshold",
      "ERROR [16:51:45] Write operation slow: Journal commit took 3.2s, syncing delayed",
      "ERROR [16:52:15] Log file descriptor count: 847/1024, nearing process limit",
      "WARN [16:52:45] Blocking I/O detected: Application thread blocked for 4.8s on disk write",
      "ERROR [16:53:30] Disk full: unable to write to /data partition (99% used)",
      "FATAL [16:54:00] CRITICAL: Application crash - No space left on device (ENOSPC)"
    ]
  },
  {
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
  },
  {
    name: "Network Connectivity Cascading Failure",
    logs: [
      "INFO [13:00:00] Network health check: All 3 availability zones healthy, latency <2ms",
      "INFO [13:00:05] Microservice discovery: 47 services registered, all responding",
      "INFO [13:15:20] Request routing: 5,200 req/s distributed across 8 backend instances",
      "WARN [13:30:45] Network packet loss detected: region-us-east-1b losing 0.3% packets",
      "WARN [13:31:15] Service discovery: Timeout connecting to payment-service-3 (10.2.5.42:8080)",
      "WARN [13:32:00] Circuit breaker OPEN for payment-service: 5 consecutive failures",
      "WARN [13:32:45] Retry logic activated: rerouting requests to payment-service-1, -2",
      "ERROR [13:33:10] DNS resolution timeout for auth-service: took 5.2s, max: 1s",
      "ERROR [13:33:45] Cannot reach cache cluster: Network is unreachable (ENETUNREACH)",
      "WARN [13:34:20] Cascading failure: 12 dependent services degraded due to auth-service timeout",
      "ERROR [13:35:00] Load balancer health check failed: 6/8 backend instances unreachable",
      "ERROR [13:35:45] Database replication lag detected: secondary is 240s behind primary",
      "FATAL [13:36:15] CRITICAL: Service mesh control plane unreachable, unable to update routing policies"
    ]
  }
];

async function runScenario() {
  // Pick random incident or cycle through them
  const scenarioIndex = Math.floor(Math.random() * incidents.length);
  const scenario = incidents[scenarioIndex];

  console.log(`\n🎬 Screamer: Injecting ${scenario.name}...`);
  console.log(`📊 ${scenario.logs.length} log events with causal chain\n`);

  // Inject all logs
  for (const log of scenario.logs) {
    await client.rPush(CONFIG.redis.listName, log);
    // Add small delay to simulate real-time logging
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`✅ Injection complete. Waiting for incident_responder to process...\n`);
  await client.quit();
}

runScenario().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});