import { createClient } from 'redis';

const REDIS_LIST = "ops_sentinel_buffer";
const BATCH_SIZE = 1000;
const WINDOW_MS = 1000;

const redis = createClient();
await redis.connect();

async function processLogBatch() {
    const rawLogs = await redis.lRange(REDIS_LIST, 0, BATCH_SIZE - 1);
    if (rawLogs.length === 0) return { raw: 0, processed: 0 };

    await redis.lTrim(REDIS_LIST, BATCH_SIZE, -1);
 
    const dedupeSet = new Set();
    const processedLogs = [];

    for (const log of rawLogs) {
        if (log.includes("INFO") || log.includes("DEBUG")) continue;

        const pattern = log
            .replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g, "<TIME>")
            .replace(/\b\d{1,3}(\.\d{1,3}){3}\b/g, "<IP>")
            .replace(/0x[a-fA-F0-0]+/g, "<HEX>");
        if (!dedupeSet.has(pattern)) {
            dedupeSet.add(pattern);
            processedLogs.push(log);
        }
    }

    return {
        raw: rawLogs.length,
        processed: processedLogs.length
    };
}

async function runStressTest() {
    let totalIn = 0;
    let totalOut = 0;

    console.log("🚀 Starting Ingestion Layer Test...");

    setInterval(async () => {
        const stats = await processLogBatch();
        totalIn += stats.raw;
        totalOut += stats.processed;

        if (totalIn > 0) {
            const cr = (1 - (totalOut / totalIn)) * 100;
            process.stdout.write(`\r[STATS] Ingested: ${totalIn} | Unique Error Patterns: ${totalOut} | Compression: ${cr.toFixed(2)}%`);
        }
    }, 100); 
}

runStressTest();