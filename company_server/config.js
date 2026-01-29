export const CONFIG = {
  redis: {
    host: "127.0.0.1",
    port: 6379,
    listName: "ops_sentinel_buffer"
  },
  screamer: {
    totalLogs: 200
  },
  buffer: {
    releaseRateMs: 500, // Faster processing for complex logs
    historyWindowSize: 100 // Larger history for longer incident chains
  },
  // Causal signals identifying root causes
  causalSignals: [
    "WARN", "ERROR", "FATAL",
    "limit", "slow", "retry", "threshold", "GC",
    "latency", "timeout", "exhausted", "degraded",
    "pressure", "pool", "connection", "lag",
    "fragmentation", "growth", "spike", "cascading",
    "unreachable", "loss", "ECONNREFUSED", "ENETUNREACH",
    "OOM", "heap out of memory", "ENOSPC", "No space left"
  ],
  severity: {
    CRITICAL: [
      "FATAL", "CRASH", "heap out of memory",
      "out of memory", "ENOSPC", "No space left on device",
      "READONLY", "Service degradation",
      "Cannot connect", "control plane unreachable"
    ],
    ERROR: [
      "ERROR", "FAIL", "ECONNREFUSED", "ENETUNREACH",
      "timeout", "failed", "unable to", "Cannot",
      "cascading failure", "health check failed"
    ]
  }
};