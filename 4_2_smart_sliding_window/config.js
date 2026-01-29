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
    releaseRateMs: 1000,
    historyWindowSize: 50 // We keep more history now for deep backtracking
  },
  // High-priority signals that act as "Cause" candidates
  causalSignals: ["WARN", "limit", "slow", "retry", "threshold", "GC"],
  severity: {
    CRITICAL: ["FATAL", "CRASH", "heap out of memory"],
    ERROR: ["ERROR", "FAIL", "ECONNREFUSED"]
  }
};