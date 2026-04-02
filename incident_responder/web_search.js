import { fetchStackOverflowSolution } from '../v2-beta-iteration/local_llm/services/externalRetrievalService.js';
import { getChatResponse, generateSearchTags } from './controllers/aiController.js';

/**
 * 🌐 EXCLUSIVE WEB SEARCH BENCHMARK
 * Bypasses Stage 1 to test External Retrieval + SLM Reasoning
 */
async function testWebSearchPerformance() {
  // Use a highly obscure error not likely in your playbooks
  const obscureError = "FATAL: unexpected error code 0x9fb2 during kernel-level buffer swap";
  const forensicStory = [obscureError];

  console.log("📡 Starting Path 3 (Agentic Web) Test...");
  const start = Date.now();

  try {
    // 1. Tag Generation (Metadata Extraction)
    const tags = await generateSearchTags(forensicStory);
    console.log(`🏷️ Tags Generated: ${tags.join(', ')}`);

    // 2. Web Retrieval (Stack Overflow)
    console.log("🌐 Fetching from Stack Overflow...");
    const externalKnowledge = await fetchStackOverflowSolution(obscureError, tags);

    if (!externalKnowledge) {
      throw new Error("No web solution found. Performance test invalid.");
    }

    // 3. SLM Summarization
    console.log("🧠 Summarizing via SLM...");
    const solution = await getChatResponse(obscureError, [externalKnowledge]);

    const duration = Date.now() - start;

    console.log(`\n✅ WEB SEARCH TEST COMPLETE`);
    console.log(`------------------------------`);
    console.log(`⏱️  Total Latency: ${duration}ms`);
    console.log(`📂 Knowledge Size: ${externalKnowledge.length} chars`);
    console.log(`------------------------------`);
    
    // Compare against Figure 3 benchmark
    const benchmark = 4800;
    const diff = duration - benchmark;
    console.log(`📊 Variance from Paper: ${diff > 0 ? '+' : ''}${diff}ms`);

  } catch (error) {
    console.error("❌ Test Failed:", error.message);
  } finally {
    process.exit(0);
  }
}

testWebSearchPerformance();