# 🛡️ Ops-Sentinel: Enterprise AI-Powered Autonomous Incident Responder

A unified incident response platform that combines:
- **Company Server** (Realistic enterprise error log simulator)
- **Buffer Handler** (Advanced forensic log extraction & causal chain analysis)
- **RAG Service** (AI-powered incident resolution with Supabase + Hugging Face)

## 🚀 Quick Start

```bash
# Terminal 1: Start incident responder
npm install
npm start

# Terminal 2: Inject complex incident (from company_server folder)
node screamer.js

# Watch incident resolution in Terminal 1
```

That's it! The system will:
1. Detect CRITICAL events automatically
2. Extract forensic causal chains
3. Search SRE documentation using RAG
4. Provide AI-powered solutions
5. Clean up resolved logs

## Features

✅ **Complex Real-World Logs** - Simulates 5 major incident scenarios:
- Memory Exhaustion (Redis OOM)
- Database Connection Pool Exhaustion
- Disk Space & Logging Cascade
- Memory Leak & GC Pressure
- Network Connectivity Cascading Failure

✅ **Intelligent Log Parsing** - Case-insensitive pattern matching for enterprise logs with timestamps

✅ **Causal Chain Extraction** - Automatically identifies root cause → build-up → crash progression

✅ **RAG-Powered Resolution** - Uses embeddings + LLM to find & apply relevant SRE playbooks

✅ **Auto-Cleanup** - Resolved logs are automatically removed from Redis buffer

✅ **Real-time Monitoring** - Continuous background analysis with formatted console output

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│   Phase 1: Log Injection (Company Server)                 │
│  • 5 realistic incident scenarios with causal chains      │
│  • 200 logs total per incident (enterprise scale)         │
│  • Metrics: CPU%, memory, latency, connections            │
│  • Logs pushed to Redis "ops_sentinel_buffer" queue       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│   Phase 2: Buffer Handler (Forensic Extraction)           │
│  • Poll Redis every 10ms (100 checks/second)              │
│  • Analyze every 250ms (4 analyses/second, max 5 parallel)│
│  • Keep 200-log history window                            │
│  • On CRITICAL/FATAL: Extract forensic story             │
│  • Find first causal signal (20+ patterns)                │
│  • Filter to WARN/ERROR/FATAL from cause → crash         │
│  • Queue story for RAG analysis                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│    Phase 3: RAG Resolution (AI Analysis)                  │
│  • Generate 2-3 technical tags from forensic story        │
│  • Embed crash line via Sentence Transformers (384-dim)   │
│  • Vector search Supabase with tag filters                │
│  • Retrieve 3 most relevant documentation chunks          │
│  • Generate grounded solution via Llama-3.2 SLM           │
│  • Broadcast to all SSE clients in real-time              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│  Phase 4: HTTP API + Real-Time Streaming                  │
│  • GET /stream - SSE live incident & queue updates        │
│  • POST /resolve - Manual incident submission             │
│  • POST /ingest - Upload SRE documentation (PDF)          │
│  • POST /approve-solution - Save Human Verified fixes     │
│  • GET /health - System status & client count             │
│  • Auto-cleanup: Remove resolved logs from Redis          │
└────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

Dependencies:
- `redis` - Redis client for buffer management
- `express` - HTTP server framework
- `@supabase/supabase-js` - Supabase client for knowledge base
- `@huggingface/inference` - Text embeddings & LLM inference
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing
- `multer` - File upload handling (PDF ingestion)

### 2. Configure Environment
Create `.env` file in the incident_responder directory:
```bash
HF_TOKEN=hf_your_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
```

Required variables:
- `HF_TOKEN` - Hugging Face API token (free tier available)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous/public key

**Supabase Setup:**
Create a table `document_chunks` with:
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(384),  -- Matches all-MiniLM-L6-v2 output
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

### 3. Start the Server
```bash
npm start
```

Or with auto-reload on file changes:
```bash
npm run dev
```

Server starts on `http://localhost:3001`

## Usage

### Automated Monitoring (Default)
The system continuously monitors the Redis buffer for incidents:

1. **Log Extraction** - Checks Redis queue every 10ms for new logs
2. **Incident Trigger** - On CRITICAL/FATAL events, pause and analyze
3. **Forensic Story** - Rebuilds 200-log history, finds root cause
4. **RAG Resolution** - Embeds crash line, searches SRE playbooks
5. **Solution Generation** - LLM generates fix with grounded context
6. **Broadcast** - SSE clients receive solution in real-time
7. **Cleanup** - Resolved logs removed from Redis buffer

**Console Output:**
```
·················🚨 CRITICAL! Analyzing incident...
✅ RESOLVED | Tags: redis,memory,oom | Sources: ["redis-memory.pdf"] 
📖 Solution: Scale Redis cluster, increase maxmemory...
```

Dots (·) = normal logs processed, 🚨 = incident detected, ✅ = resolved

### Real-Time Web Dashboard
Subscribe to SSE stream for live updates:

```html
<script>
  const events = new EventSource('http://localhost:3001/stream');
  
  events.onmessage = (e) => {
    const data = JSON.parse(e.data);
    
    // Queue depth updates every 1 second
    if (data.type === 'QUEUE_UPDATE') {
      document.getElementById('backlog').textContent = data.backlog;
    }
    
    // Resolved incidents broadcast immediately
    if (data.type === 'MANUAL_RESOLUTION' || data.solution) {
      showIncident(data);
    }
  };
</script>
```

**Features:**
- Real-time queue backlog (updated every 1 second)
- Instant incident resolution notifications
- Connection count and timestamp metadata

### Document Ingestion (Build Knowledge Base)
Upload SRE documentation or runbooks as PDF:

```bash
curl -X POST http://localhost:3001/ingest \
  -F "manual=@redis-operations.pdf"
```

**Auto-Tagging:**
- System analyzes first chunk of PDF
- Generates 2-3 relevant technical tags automatically
- Tags applied to all chunks for better retrieval
- Example: PDF on "Redis Memory Management" → Tags: `["redis", "memory", "ops"]`

**Workflow:**
- Split PDF into 1000-char chunks with 200-char overlap
- Create embeddings via Hugging Face Sentence Transformers (384-dimensional)
- Store in Supabase with metadata (source, tags, timestamps)
- Index for vector similarity search (IVFFlat algorithm)

### Manual Incident Resolution
Submit incident logs via HTTP when automated monitoring isn't active:

```bash
curl -X POST http://localhost:3001/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "story": [
      "WARN: Garbage Collection taking longer than 500ms",
      "WARN: Heap usage at 88% - Approaching limit",
      "WARN: Heap usage at 95% - Critical pressure",
      "FATAL ERROR: JavaScript heap out of memory"
    ]
  }'
```

**Response:**
```json
{
  "status": "success",
  "forensicStory": [
    "WARN: Heap usage at 88%",
    "WARN: Heap usage at 95%",
    "FATAL: JavaScript heap out of memory"
  ],
  "solution": "Root cause: Unbounded object retention...\n\nFix:\n1. Review object lifecycle\n2. Force GC marking...",
  "tags": ["nodejs", "memory", "gc"],
  "sources": ["nodejs-memory-profiling.pdf"],
  "matchesFound": 3
}
```

### Save Human-Verified Solutions
Learn from manual resolutions to improve future incident matching:

```bash
curl -X POST http://localhost:3001/approve-solution \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "Root cause: Unbounded memory growth in listener callbacks. Fix: Implement weakMap for listener tracking.",
    "tags": ["nodejs", "memory", "events"],
    "forensicStory": [
      "WARN: Heap usage at 88%",
      "WARN: Heap usage at 95%", 
      "FATAL: JavaScript heap out of memory"
    ]
  }'
```

**Behavior:**
- Embeds forensic story (problem) into knowledge base
- Tags enable better future matching for similar incidents
- Marked as verified for priority in search results
- Source shown as "Human Verified" in responses

## API Endpoints

### GET /stream
Establishes a long-lived HTTP Server-Sent Events (SSE) connection for real-time incident updates and queue backlog information.

**Usage:**
```javascript
const eventSource = new EventSource('http://localhost:3001/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'QUEUE_UPDATE') {
    console.log(`Queue depth: ${data.backlog}`);
  } else {
    console.log(`Incident resolved: ${data.solution}`);
  }
};
```

**Broadcasting:**
- Automated incidents: Broadcast when background buffer handler resolves an incident
- Queue updates: Broadcast backlog count every 1 second
- Manual resolutions: Broadcast when `/resolve` endpoint is called

### POST /ingest
Upload and ingest PDF documentation into the knowledge base with auto-generated tags.

**Request:**
```bash
curl -X POST http://localhost:3001/ingest \
  -F "manual=@operations-manual.pdf"
```

**Response:**
```json
{
  "message": "Ingestion successful with auto-tagging",
  "file": "operations-manual.pdf"
}
```

**Behavior:**
- Extracts text from PDF
- Chunks content using configurable size/overlap
- Auto-generates 2-3 relevant tags from first chunk
- Creates embeddings via Hugging Face Sentence Transformers
- Stores in Supabase with metadata

### POST /resolve
Manually submit an incident for RAG-powered resolution.

**Request:**
```json
{
  "story": ["log line 1", "log line 2", ...]
}
```

**Response:**
```json
{
  "status": "success",
  "forensicStory": [...],
  "solution": "AI-generated solution...",
  "tags": ["relevant", "tags"],
  "sources": ["document-names"],
  "matchesFound": 3
}
```

**Behavior:**
- Analyzes forensic story to generate search tags
- Embeds crash line using Sentence Transformers
- Searches Supabase document chunks with tag filters
- Generates grounded solution via LLM
- Broadcasts to all connected SSE clients

### POST /approve-solution
Save a human-verified solution to the knowledge base for future reference.

**Request:**
```json
{
  "solution": "Root cause was X. Fix by doing Y.",
  "tags": ["nodejs", "memory"],
  "forensicStory": ["log line 1", "log line 2", ...]
}
```

**Response:**
```json
{
  "status": "success"
}
```

**Behavior:**
- Embeds the forensic story (problem) not the solution
- Saves with metadata marking as `is_verified: true`
- Source marked as "Human Verified"
- Makes the pattern retrievable for future similar incidents

### GET /health
Check system operational status.

**Response:**
```json
{
  "status": "operational",
  "clientsConnected": 2,
  "components": {
    "redisBuffer": "monitoring",
    "ragService": "active"
  },
  "timestamp": "2025-01-29T14:30:45.123Z"
}
```

### GET /status
Get current monitoring configuration and status.

**Response:**
```json
{
  "status": "running",
  "mode": "automated_monitoring",
  "bufferReleaseRateMs": 250,
  "timestamp": "2025-01-29T14:30:45.123Z"
}
```

## Workflow

### Phase 1: Log Injection & Streaming
Company Server generates realistic incident scenarios:

**5 Built-in Scenarios:**

1. **Memory Exhaustion - Redis OOM** (16 events)
   - Progressive memory pressure (85% → 92% → READONLY)
   - Cache hit rate degradation (94% → 71%)
   - Queue backpressure detection
   - Final crash: Redis OOM command rejection

2. **Database Connection Pool Exhaustion** (13 events)
   - Connection utilization increase (90% → 100%)
   - Slow query detection on indexed tables
   - Pool timeout cascades
   - Node health check failure

3. **Disk Space and Logging Cascade** (13 events)
   - Progressive disk fill (72% → 91% → 99%)
   - I/O latency spikes (8ms → 150ms)
   - RDB snapshot failures
   - Final crash: ENOSPC (No space left on device)

4. **Memory Leak and GC Pressure** (13 events)
   - Heap fragmentation detection
   - GC pause time increase (120ms → 240ms on young generation)
   - Memory growth trend extrapolation
   - Final crash: Heap OOM

5. **Network Connectivity Cascading Failure** (13 events)
   - Packet loss detection (0% → 5% → 25%)
   - Service discovery timeout (DNS resolution failures)
   - Circuit breaker opens
   - Service mesh control plane unreachable
   - Cascading health check failures

Each scenario includes:
- ISO timestamps in HH:MM:SS format
- Log levels: INFO, WARN, ERROR, FATAL
- Real metrics: CPU%, memory%, connections, latency (ms), throughput (req/s)
- Service names: PostgreSQL, Redis, Node.js, etc.
- Realistic error messages and recovery patterns

### Phase 2: Buffer Handler (Forensic Extraction)

**Every 250ms analysis cycle:**

1. **Fetch Logs** - Check Redis queue for new entries (10ms polling rate)
2. **Detect CRITICAL** - Match `console.log` marked with CRITICAL/FATAL keywords
3. **Build History** - Retrieve 200-log window from memory buffer
4. **Find Root Cause** - Scan backwards for first causal signal (20+ patterns):
   - Resource pressure: `limit`, `threshold`, `usage`, `pressure`, `exhausted`
   - Performance: `latency`, `slow`, `timeout`, `lag`, `spike`
   - System errors: `OOM`, `ENOSPC`, `ENETUNREACH`, `ECONNREFUSED`
   - Cascading: `circuit breaker`, `cascading`, `degraded`, `unreachable`
5. **Filter Story** - Keep only WARN/ERROR/FATAL lines from cause → crash
6. **Queue Analysis** - Add forensic story to analysis queue (max 5 concurrent)

**Example Extraction:**
```
Redis Queue (16 raw logs):
  [0] INFO: Startup
  [1] INFO: PostgreSQL connected
  ...
  [10] WARN: Redis memory 85%  ← FOUND CAUSE (first causal signal)
  [11] WARN: Redis memory 92%
  [12] ERROR: OOM command rejected
  [13] FATAL: READONLY  ← DETECTED CRITICAL
  
Extracted Story (filtered to 4 logs):
  1. WARN: Redis memory 85%
  2. WARN: Redis memory 92%
  3. ERROR: OOM rejected
  4. FATAL: READONLY
```

### Phase 3: RAG Resolution (AI-Powered)

**For each forensic story (max 5 parallel):**

1. **Generate Tags** - LLM analyzes story → 2-3 technical tags
   ```
   Input: ["WARN memory 92%", "ERROR OOM", "FATAL READONLY"]
   Output: ["redis", "memory", "oom"]
   ```

2. **Embed Story** - Vectorize crash line via Sentence Transformers
   ```
   Text: "READONLY You can't write against a read only replica"
   Embedding: [0.23, -0.15, 0.89, ..., -0.04]  // 384 dimensions
   ```

3. **Search Knowledge Base** - Query Supabase with vector similarity
   ```
   SELECT content, metadata 
   FROM document_chunks 
   WHERE metadata->>'tags' CONTAINS 'redis'
   ORDER BY embedding <-> query_embedding
   LIMIT 3
   ```

4. **Generate Solution** - LLM uses retrieved context (strict grounding)
   ```
   System prompt: "Use context to solve incident. Keep <100 words."
   Context: [Retrieved 3 matching playbook chunks]
   Incident: "READONLY write rejection in Redis cluster"
   Response: "Root cause: Redis running in read-only mode due to OOM...
             Fix: 1. Scale cluster to add nodes. 2. Reduce data retention..."
   ```

5. **Broadcast Results** - Send to all connected SSE clients
   ```json
   {
     "type": "INCIDENT_RESOLVED",
     "solution": "...",
     "tags": ["redis", "memory"],
     "sources": ["redis-ops.pdf"],
     "matchesFound": 3
   }
   ```

6. **Save & Cleanup** - Remove processed logs from Redis buffer

**Key Features:**
- **Grounded LLM**: Uses only retrieved documentation (no hallucinations)
- **Concurrent Analysis**: Max 5 incidents analyzed in parallel
- **Real-time Streaming**: SSE broadcast to all connected dashboards
- **Human Learning**: Save verified solutions to knowledge base
- **Tag Filtering**: Narrow searches to relevant documentation

### Complete Example: Redis Memory Exhaustion

**Input (Company Server injects 16 logs):**
```
[14:25:42] INFO: Server startup (PID 4521)
[14:22:03] INFO: PostgreSQL connected, pool=20
[14:22:05] INFO: Redis Cluster ready, 6 nodes
...
[14:25:42] WARN: Redis memory usage: 85% (7.15 GB / 8.4 GB)
[14:26:01] INFO: Batch import job started, 50,000 records
[14:27:15] WARN: Redis memory usage: 92% (7.73 GB / 8.4 GB)
[14:27:45] WARN: Session cache hit rate: 71% (was 94%)
[14:28:12] ERROR: MISCONF Redis persistence failed
[14:29:01] ERROR: OOM command not allowed on key 'batch_checkpoint_1'
[14:29:15] WARN: Queue backpressure: 12,000 jobs pending
[14:30:12] FATAL: READONLY You can't write against a read only replica
```

**Extraction by Buffer Handler:**
```
[Every 250ms check]
✓ [14:30:12] FATAL detected → trigger analysis
✓ Retrieve 200-log history
✓ Find first causal signal: WARN at [14:25:42] "Redis memory 85%"
✓ Build forensic story from cause → crash (6 logs)
```

**Forensic Story (Queue for Analysis):**
```
1. WARN [14:25:42] Redis memory usage: 85%
2. WARN [14:27:15] Redis memory usage: 92%
3. ERROR [14:28:12] MISCONF Redis persistence failed
4. ERROR [14:29:01] OOM command not allowed
5. WARN [14:29:15] Queue backpressure: 12,000 jobs pending
6. FATAL [14:30:12] READONLY write rejection
```

**AI Analysis:**
```
Step 1 - Tags: ["redis", "memory", "oom"]
Step 2 - Embed crash line (384-dim vector)
Step 3 - Search: Found 3 matching docs (all tagged "redis" + "memory")
Step 4 - Generate solution using LLM + context chunks
Step 5 - Broadcast to dashboard
```

**Solution (Broadcast):**
```
Root cause: Redis memory exhaustion at 92% usage with eviction active.

Immediate actions:
1. Scale cluster: Add 2-3 more nodes (currently 6)
2. Increase maxmemory limit or add RAM to existing nodes
3. Optimize batch import: Reduce chunk from 50K to 10K records
4. Enable RDB persistence monitoring
5. Implement circuit breaker for queue depth > 5K jobs

See referenced docs: ["redis-memory-ops.pdf", "cache-scaling.pdf"]
```

**Result:**
```
✅ RESOLVED | [14:30:15] Tags: redis, memory, oom
📊 Matches: 3 docs | Sources: 2 playbooks | Time: 3s
✓ Cleanup: 16 logs removed from Redis buffer
```

## Configuration

Edit `config.js` to customize behavior:

```javascript
// Redis & Screaming Server
redis: {
  host: "127.0.0.1",
  port: 6379,
  listName: "ops_sentinel_buffer"
},
screamer: {
  totalLogs: 200  // Number of logs to generate per incident scenario
},

// Buffer Handler
buffer: {
  fetchRateMs: 10,              // Check for new logs every 10ms
  releaseRateMs: 250,           // Analyze incidents every 250ms
  historyWindowSize: 200,       // Keep 200-log history for causal chains
  maxParallelAnalyses: 5,       // Max concurrent AI analysis calls
  causalSignals: [              // 20+ patterns indicating root cause
    "WARN", "ERROR", "FATAL", "latency", "timeout", "OOM", 
    "ENOSPC", "ECONNREFUSED", ...
  ],
  severity: {
    CRITICAL: ["FATAL", "CRASH", "heap out of memory", ...],
    ERROR: ["ERROR", "FAIL", "timeout", ...]
  }
},

// Text Chunking for Document Ingestion
chunks: {
  size: 1000,      // Characters per chunk
  overlap: 200     // Overlap between chunks for context
},

// RAG Service & AI Controllers
ai: {
  embeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
  chatModel: "mistralai/Mistral-7B-Instruct-v0.1",  // Small Language Model
  temperature: 0.1  // 0=deterministic, 1=creative
},

// Server
port: 3001
```
