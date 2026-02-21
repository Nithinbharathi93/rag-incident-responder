// screamer.js
import axios from 'axios';

const LOG_LEVELS = ["INFO", "DEBUG", "WARN", "ERROR"];
const ERROR_MESSAGES = [
  "ECONNREFUSED: Database connection failed at port 5432",
  "TypeError: Cannot read property 'id' of undefined",
  "Kube-Error: Pod 'api-gateway' entered CrashLoopBackOff",
  "EOLERR: Unexpected end of input in stream buffer",
  "BufferError: Memory limit exceeded during log rotation"
];

const generateLog = () => {
  const level = Math.random() > 0.9 ? "ERROR" : LOG_LEVELS[Math.floor(Math.random() * 3)];
  const timestamp = new Date().toISOString();
  
  let message = `User ${Math.floor(Math.random() * 1000)} performed action: ${Math.random().toString(36).substring(7)}`;
  
  if (level === "ERROR") {
    message = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
  }

  return `[${timestamp}] ${level}: ${message}`;
};

// Start "Screaming" - 100 logs per second
console.log("🚀 Server started. Screaming logs at 100 lines/sec...");

setInterval(async () => {
  const logLine = generateLog();
  
  // For Stage 1, we just print it. 
  // In Stage 2, we will replace this with a Redis LPUSH.
  console.log(logLine);

}, 10); // 10ms = 100 logs per second