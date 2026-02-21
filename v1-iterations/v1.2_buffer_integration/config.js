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
    releaseRateMs: 1000 // 1 line per second
  }
};