import { resolveIncidentWithRAG } from './integrationHandler.js';

/**
 * 🚀 RAG SPEED BENCHMARK
 * Measures end-to-end latency from Forensic Story input to AI Solution.
 */
async function runRAGBenchmark() {
  const testStory = [
    "WARN [11:35:50] Heap size: 1.3 GB (65% of max)",
    "ERROR [12:05:20] GC overhead limit exceeded",
    "FATAL [12:35:15] FATAL: JavaScript heap out of memory"
  ];

  console.log("⏱️  Starting RAG Speed Test...");
  const start = Date.now();

  try {
    const result = await resolveIncidentWithRAG(testStory);
    const duration = Date.now() - start;

    console.log(`\n✅ TEST COMPLETE`);
    console.log(`------------------------------`);
    console.log(`⏱️  Total Latency: ${duration}ms`);
    console.log(`🎯 Confidence Score: ${result.confidence.toFixed(2)}`);
    console.log(`📂 Source Type: ${result.sources.includes("External") ? "EXTERNAL (Path 3)" : "INTERNAL (Path 2)"}`);
    console.log(`------------------------------`);

    // Compare against Research Paper Benchmarks
    if (duration < 1500) {
      console.log("🚀 PERFORMANCE: EXCELLENT (Matches Path 2: Internal RAG)");
    } else if (duration < 5000) {
      console.log("🟡 PERFORMANCE: AVERAGE (Matches Path 3: Agentic Web)");
    } else {
      console.log("⚠️ PERFORMANCE: SLOW (Check network or API limits)");
    }

  } catch (error) {
    console.error("❌ Benchmark failed:", error.message);
  } finally {
    process.exit(0);
  }
}

runRAGBenchmark();