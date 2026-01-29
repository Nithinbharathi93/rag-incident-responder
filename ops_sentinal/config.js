import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  // --- Infrastructure & Credentials ---
  hfToken: process.env.HF_TOKEN,
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  redis: {
    host: "127.0.0.1",
    port: 6379,
    listName: "ops_sentinel_buffer"
  },

  // --- AI & RAG Settings ---
  ai: {
    embeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
    chatModel: "meta-llama/Llama-3.1-8B-Instruct", 
    temperature: 0.1,
    ragServiceUrl: "http://localhost:3001/resolve"
  },
  chunks: {
    size: 1000,
    overlap: 200
  },

  // --- Log Observer Logic ---
  screamer: {
    totalLogs: 200
  },
  buffer: {
    releaseRateMs: 1000,
    historyWindowSize: 50 // Keep 50 logs for deep backtracking
  },

  // --- Heuristics & Signals ---
  causalSignals: ["WARN", "limit", "slow", "retry", "threshold", "GC"],
  severity: {
    CRITICAL: ["FATAL", "CRASH", "heap out of memory"],
    ERROR: ["ERROR", "FAIL", "ECONNREFUSED"]
  }
};