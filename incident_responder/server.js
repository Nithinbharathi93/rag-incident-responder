import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeIntegrationHandler, shutdownHandler, resolveIncidentWithRAG } from './integrationHandler.js';
import { CONFIG } from './config.js';
import { ingestDocument } from './services/ingestor.js';
import cors from 'cors';
import { createClient } from 'redis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS with proper SSE configuration
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Serve static files from parent directory (where index.html is located)
app.use(express.static(path.join(__dirname, '..')));

// ============================================
// LIVE STREAMING SETUP (SSE)
// ============================================

// Store active connections for live streaming
const connectedClients = new Set();

/**
 * GET /stream
 * Establishes a long-lived HTTP connection for live incident updates.
 */
app.get('/stream', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Add client to the broadcast pool
  connectedClients.add(res);
  console.log(`🔌 New client connected to stream. Total: ${connectedClients.size}`);

  req.on('close', () => {
    connectedClients.delete(res);
    console.log(`🔌 Client disconnected. Total: ${connectedClients.size}`);
  });
});

/**
 * Global broadcast function
 * Can be called from the integration handler when a background incident is resolved.
 */
export const broadcastIncident = (incidentData) => {
  const payload = JSON.stringify({
    ...incidentData,
    timestamp: new Date().toISOString()
  });

  connectedClients.forEach(client => {
    client.write(`data: ${payload}\n\n`);
  });
};

/**
 * Broadcast backlog depth in real-time
 * Shows exact queue size to all connected clients
 */
export const broadcastBacklog = (backlogCount) => {
  const payload = JSON.stringify({
    type: 'QUEUE_UPDATE',
    backlog: backlogCount,
    timestamp: new Date().toISOString()
  });

  connectedClients.forEach(client => {
    client.write(`data: ${payload}\n\n`);
  });
};

// ============================================
// ROUTES FOR DOCUMENT INGESTION
// ============================================

app.post('/ingest', upload.single('manual'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF provided." });
    await ingestDocument(req.file.buffer, req.file.originalname);
    res.json({ message: "Ingestion successful with auto-tagging", file: req.file.originalname });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROUTES FOR INCIDENT RESOLUTION
// ============================================

app.post('/resolve', async (req, res) => {
  try {
    const { story } = req.body;
    if (!story || !Array.isArray(story)) return res.status(400).json({ error: "Invalid story format." });

    const resolution = await resolveIncidentWithRAG(story);
    const fullResponse = {
      status: "success",
      forensicStory: story,
      solution: resolution.solution,
      tags: resolution.tagsUsed,
      sources: resolution.sources,
      matchesFound: resolution.documentMatches,
    };

    // Also broadcast manual resolutions to any open dashboards
    broadcastIncident({ type: 'MANUAL_RESOLUTION', ...fullResponse });

    res.json(fullResponse);
  } catch (error) {
    res.status(500).json({ error: error.message, status: "failed" });
  }
});

// ============================================
// HEALTH & STATUS
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: "operational",
    clientsConnected: connectedClients.size,
    timestamp: new Date().toISOString(),
    components: { redisBuffer: "monitoring", ragService: "active" }
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: "running",
    mode: "automated_monitoring",
    bufferReleaseRateMs: CONFIG.buffer.releaseRateMs,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = CONFIG.port || 3000;

// Initialize Redis client for backlog monitoring
const redisClient = createClient({
  host: CONFIG.redis.host,
  port: CONFIG.redis.port
});

app.listen(PORT, async () => {
  console.log(`\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║         🛡️  FINAL RESPONDER - INTEGRATED SERVICE        ║`);
  console.log(`╚════════════════════════════════════════════════════════╝\n`);
  console.log(`✅ HTTP Server: http://localhost:${PORT}`);
  console.log(`📡 Live Stream: http://localhost:${PORT}/stream`);

  // Connect to Redis for backlog monitoring
  try {
    await redisClient.connect();
    console.log(`✅ Redis connected for backlog monitoring`);
  } catch (error) {
    console.error(`⚠️ Redis backlog monitoring not available: ${error.message}`);
  }

  // Broadcast queue backlog every second for real-time updates
  setInterval(async () => {
    try {
      const backlogCount = await redisClient.lLen(CONFIG.redis.listName);
      broadcastBacklog(backlogCount);
    } catch (error) {
      console.error(`⚠️ Backlog broadcast error: ${error.message}`);
    }
  }, 1000); // Update every second
});

// Pass the broadcast function to the handler so background events can trigger it
initializeIntegrationHandler(broadcastIncident, broadcastBacklog);

// Graceful shutdown
const handleShutdown = async () => {
  console.log('\n⚠️ Shutting down...');
  connectedClients.forEach(c => c.end());
  await shutdownHandler();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);