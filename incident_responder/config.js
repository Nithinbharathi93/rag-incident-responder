import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  // Redis Configuration (for screaming server + buffer)
  redis: {
    host: "127.0.0.1",
    port: 6379,
    listName: "ops_sentinel_buffer"
  },

  // Screaming Server Configuration
  screamer: {
    totalLogs: 200
  },

  // Buffer Handler Configuration
  buffer: {
    releaseRateMs: 500, // Faster processing for complex logs
    historyWindowSize: 100, // Larger history for longer incident chains
    // High-priority signals that act as "Cause" candidates
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
  },

  // RAG Service Configuration
  hfToken: process.env.HF_TOKEN,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  ai: {
    embeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
    chatModel: "meta-llama/Llama-3.1-8B-Instruct",
    temperature: 0.1
  },
  chunks: {
    size: 1000,
    overlap: 200
  },

  // Server Port
  port: 3001
};
