import { createClient } from 'redis';
import { CONFIG } from './config.js';

const client = createClient();
await client.connect();

const HISTORY_KEY = "ops_sentinel_history";

async function processBuffer() {
  console.log(`🛡️ Stage 4.2: High-Fidelity Forensic Mode Active...`);

  setInterval(async () => {
    const logLine = await client.lPop(CONFIG.redis.listName);
    if (!logLine) return;

    // 1. Maintain Rolling Memory
    await client.lPush(HISTORY_KEY, logLine);
    await client.lTrim(HISTORY_KEY, 0, CONFIG.buffer.historyWindowSize - 1);

    // 2. Identify the Trigger (Final Crash)
    const isFatal = CONFIG.severity.CRITICAL.some(s => logLine.includes(s));

    if (isFatal) {
      const fullHistory = await client.lRange(HISTORY_KEY, 0, -1);
      
      // 3. BACKTRACK & FILTER: 
      // We look back to find the first causal signal, then filter out any noise in between.
      let pivotIndex = -1;
      for (let i = 0; i < fullHistory.length; i++) {
        if (CONFIG.causalSignals.some(signal => fullHistory[i].includes(signal))) {
          pivotIndex = i;
        }
      }

      console.log(`\n━━━━━━━ 🔍 CRASH-ONLY FORENSIC REPORT ━━━━━━━`);
      
      if (pivotIndex !== -1) {
        // Slice from crash (0) to pivot, reverse to chronological, then FILTER noise
        const crashChain = fullHistory
          .slice(0, pivotIndex + 1)
          .reverse()
          .filter(line => {
             // Only keep lines that are categorized as CRITICAL, ERROR, or WARNING
             const isSignal = [...CONFIG.severity.CRITICAL, ...CONFIG.severity.ERROR, ...CONFIG.causalSignals]
               .some(keyword => line.includes(keyword));
             return isSignal;
          });

        crashChain.forEach((line, index) => {
          let label = "📈 [BUILD]";
          if (index === 0) label = "🌱 [CAUSE]";
          if (index === crashChain.length - 1) label = "💥 [CRASH]";

          console.log(`${label.padEnd(12)} | ${line}`);
        });
      } else {
        console.log(`💥 [ISOLATED CRASH] | ${logLine}`);
      }
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    } else {
      process.stdout.write("·");
    }
  }, CONFIG.buffer.releaseRateMs);
}

processBuffer();