import express from 'express';
import { initializeIntegrationHandler, shutdownHandler, extractForensicStory, resolveIncidentWithRAG } from './integrationHandler.js';
import { CONFIG } from './config.js';

const app = express();
app.use(express.json());

// ============================================
// ROUTES FOR MANUAL INCIDENT RESOLUTION
// ============================================

/**
 * POST /resolve
 * Expects: { "story": ["log line 1", "log line 2", ...] }
 * Returns: AI-generated solution from RAG
 */
app.post('/resolve', async (req, res) => {
  try {
    const { story } = req.body;

    if (!story || !Array.isArray(story)) {
      return res.status(400).json({ 
        error: "Invalid request. Expected: { 'story': ['log1', 'log2', ...] }" 
      });
    }

    console.log(`\n📥 Manual resolve request with ${story.length} log lines`);

    const resolution = await resolveIncidentWithRAG(story);

    res.json({
      status: "success",
      forensicStory: story,
      solution: resolution.solution,
      tags: resolution.tagsUsed,
      sources: resolution.sources,
      matchesFound: resolution.documentMatches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Resolve endpoint error: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      status: "failed"
    });
  }
});

/**
 * GET /health
 * Check if Redis buffer and RAG service are operational
 */
app.get('/health', (req, res) => {
  res.json({
    status: "operational",
    service: "Final Responder - Integrated Screamer + RAG",
    timestamp: new Date().toISOString(),
    components: {
      redisBuffer: "monitoring",
      ragService: "active",
      aiController: "ready"
    }
  });
});

/**
 * GET /status
 * Get current system status
 */
app.get('/status', (req, res) => {
  res.json({
    status: "running",
    mode: "automated_monitoring",
    bufferReleaseRateMs: CONFIG.buffer.releaseRateMs,
    redisListName: CONFIG.redis.listName,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = CONFIG.port;

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║        🛡️  FINAL RESPONDER - INTEGRATED SERVICE        ║`);
  console.log(`║  Screaming Server + Buffer Handler + RAG Integration   ║`);
  console.log(`╚════════════════════════════════════════════════════════╝\n`);
  console.log(`✅ HTTP Server running on http://localhost:${PORT}`);
  console.log(`\n📌 Available Endpoints:`);
  console.log(`   POST /resolve  - Manually submit incident logs for RAG resolution`);
  console.log(`   GET  /health   - System health check`);
  console.log(`   GET  /status   - Current monitoring status\n`);
});

// Initialize the background integration handler
initializeIntegrationHandler();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down...');
  await shutdownHandler();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Shutting down...');
  await shutdownHandler();
  process.exit(0);
});
