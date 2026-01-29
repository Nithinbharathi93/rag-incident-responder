# 🛡️ Incident Responder - Enterprise Log Analysis & RAG Resolution

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
┌──────────────────────────────────────────────────────────┐
│           Company Server (Complex Log Injection)          │
│  - 5 realistic incident scenarios with causal chains     │
│  - Timestamps, service names, metrics (CPU, memory, GC)  │
│  - Error types: OOM, timeout, connection, cascading      │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│          Buffer Handler (Phase 1: Extraction)            │
│  - Monitors Redis for CRITICAL events                    │
│  - Matches 30+ causal signals (timeout, lag, OOM, etc)   │
│  - Builds causal chain (CAUSE → BUILD-UP → CRASH)       │
│  - Case-insensitive pattern matching                     │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│            RAG Service (Phase 2: Resolution)             │
│  - Analyzes forensic story for keywords (tags)           │
│  - Embeds crash line using Hugging Face embeddings       │
│  - Searches Supabase for matching SRE documentation      │
│  - Generates AI solution using LLM with grounded context │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│    HTTP API + Automated Response & Buffer Cleanup        │
│  - POST /resolve - Manual incident submission            │
│  - GET /health - System status                           │
│  - GET /status - Monitoring status                       │
│  - Auto cleanup resolved logs from Redis                 │
└──────────────────────────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy and update `.env`:
```bash
cp .env.example .env
```

Required variables:
- `HF_TOKEN` - Hugging Face API token
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase API key

### 3. Start the Server
```bash
npm start
```

Or with watch mode:
```bash
npm run dev
```

## Usage

### Automated Monitoring (Default)
The system continuously monitors the Redis buffer for incidents:
- Logs marked with `CRITICAL`, `FATAL`, or `CRASH` trigger extraction
- Buffer handler builds causal chains from 50-log history window
- RAG service analyzes and provides AI-powered solutions
- Console output shows forensic story → solution process

### Manual Incident Resolution
Submit incident logs via HTTP:

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

Response:
```json
{
  "status": "success",
  "forensicStory": [...],
  "solution": "Clear explanation with specific fixes...",
  "tags": ["nodejs", "memory"],
  "sources": ["nodejs-runbook.pdf"],
  "matchesFound": 3,
  "timestamp": "2025-01-29T..."
}
```

## API Endpoints

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
  "matchesFound": 3,
  "timestamp": "ISO timestamp"
}
```

### GET /health
Check system operational status.

**Response:**
```json
{
  "status": "operational",
  "service": "Final Responder - Integrated Screamer + RAG",
  "components": {
    "redisBuffer": "monitoring",
    "ragService": "active",
    "aiController": "ready"
  }
}
```

### GET /status
Get current monitoring status.

**Response:**
```json
{
  "status": "running",
  "mode": "automated_monitoring",
  "bufferReleaseRateMs": 1000,
  "redisListName": "ops_sentinel_buffer"
}
```

## Configuration

Edit `config.js` to customize:

```javascript
// Redis & Screamer
redis.host, redis.port, redis.listName
screamer.totalLogs

// Buffer Handler
buffer.releaseRateMs - How often to check for incidents
buffer.historyWindowSize - Rolling history depth
buffer.causalSignals - Keywords indicating root cause
buffer.severity - Critical/error keywords

// RAG Service
ai.embeddingModel - Sentence embedding model
ai.chatModel - LLM for solution generation
ai.temperature - LLM creativity (0.1 = deterministic)
```

## Workflow

### Phase 1: Company Server (Complex Log Injection)
Generates realistic enterprise incidents:

**5 Built-in Scenarios:**

1. **Memory Exhaustion - Redis OOM** (16 events)
   - Progressive memory pressure (85% → 92% → READONLY)
   - Cache hit rate degradation
   - Queue backpressure detection
   - Final crash: Redis OOM command rejection

2. **Database Connection Pool Exhaustion** (13 events)
   - Connection utilization increase (90% → 100%)
   - Slow query detection
   - Pool timeout cascades
   - Node health check failure

3. **Disk Space and Logging Cascade** (13 events)
   - Progressive disk fill (72% → 91% → 99%)
   - I/O latency spikes
   - Log flushing delays
   - Final crash: ENOSPC (No space left)

4. **Memory Leak and GC Pressure** (13 events)
   - Heap fragmentation detection
   - GC pause time increase (120ms → 240ms)
   - Memory growth trend extrapolation
   - Final crash: Heap OOM

5. **Network Connectivity Cascading Failure** (13 events)
   - Packet loss detection
   - Service discovery timeout
   - Circuit breaker opens
   - DNS timeout cascade
   - Service mesh control plane unreachable

Each scenario includes:
- Timestamps in `HH:MM:SS` format
- Log levels: `INFO`, `WARN`, `ERROR`, `FATAL`
- Real metrics: CPU%, memory, connection counts, latency (ms)
- Service names: PostgreSQL, Redis, Node.js, etc.
- Realistic error messages

### Phase 2: Buffer Handler (Advanced Forensic Extraction)
1. Polls Redis queue at 500ms intervals
2. On CRITICAL event detection:
   - Retrieves 100-log history window (larger for complex incidents)
   - Searches for first CAUSAL signal (30+ patterns)
   - Filters to keep only ERROR/WARNING/CRITICAL lines
   - Builds chronological story: CAUSE → BUILD-UP → CRASH
3. Case-insensitive matching for enterprise log variations
4. Removes resolved logs from Redis after solution generated

**Recognized Causal Signals:**
- Latency/Performance: `latency`, `slow`, `timeout`, `lag`, `spike`
- Resource Pressure: `limit`, `threshold`, `pressure`, `usage`, `full`
- Failures: `failed`, `error`, `unable to`, `cannot`, `exhausted`
- System: `OOM`, `ENOSPC`, `ENETUNREACH`, `ECONNREFUSED`
- Cascading: `cascading`, `circuit breaker`, `degraded`, `unreachable`

### Phase 3: RAG Resolution
1. **Tag Generation** - LLM identifies tech stack from incident (redis, memory, postgres, etc.)
2. **Vectorization** - Embeds crash line using Sentence Transformers embeddings
3. **Search** - Queries Supabase for matching SRE documentation with tag filters
4. **Grounding** - Generates solution using LLM + retrieved context (strict mode)
5. **Response** - Returns solution + sources + metadata
6. **Cleanup** - Removes processed logs from Redis buffer

## Example Incident Flow

**Complex Real-World Scenario: Redis Memory Exhaustion**

**Redis Queue (16 events injected):**
```
INFO [14:22:01] Server startup: Node.js v18.16.0, PID=4521
INFO [14:22:03] Connected to PostgreSQL 13.10 (primary), connection pool size: 20
INFO [14:22:05] Redis Cluster connected: 6 nodes, version 7.0.5
...
WARN [14:25:42] Redis memory usage: 85% (7.15 GB / 8.4 GB)
INFO [14:26:01] User batch import job started, processing 50,000 records
WARN [14:27:15] Redis memory usage: 92% (7.73 GB / 8.4 GB), eviction policy: allkeys-lru
WARN [14:27:45] Session cache hit rate dropped from 94% to 71%
ERROR [14:28:12] Redis: MISCONF Redis is configured to save RDB snapshots...
ERROR [14:29:01] Cache write failed for key 'user_batch_checkpoint_1': OOM command not allowed
WARN [14:29:15] Queue backpressure detected: 12,000 jobs pending
FATAL [14:30:12] READONLY You can't write against a read only replica  ← CRASH
```

**Extracted Forensic Story (filtered, 6 events):**
```
1. WARN [14:25:42] Redis memory usage: 85%
2. WARN [14:27:15] Redis memory usage: 92%, eviction policy active
3. ERROR [14:28:12] RDB snapshot persistence error
4. ERROR [14:29:01] OOM command not allowed
5. WARN [14:29:15] Queue backpressure detected: 12,000 jobs pending
6. FATAL [14:30:12] READONLY write rejection
```

**RAG Analysis:**
- 🏷️ **Tags:** `["redis", "memory", "oom", "cache", "queue"]`
- 📚 **Documentation Matches:** 3 SRE playbooks found
- 📖 **Sources:** `["redis-memory-management.pdf", "cache-sizing.pdf"]`

**Generated Solution (AI-powered):**
```
Based on your Redis OOM incident: The root cause is memory exhaustion at 92% usage
with eviction policy enabled. Recommended actions:

1. Immediate: Scale Redis cluster to add more nodes (current: 6 nodes)
2. Increase maxmemory limit or add RAM to existing nodes
3. Review batch import logic - reduce chunk size from 50,000 to 10,000
4. Enable Redis persistence monitoring to prevent RDB snapshot failures
5. Implement circuit breaker for batch jobs when queue depth > 5,000

See attached SRE playbooks for detailed steps.
```

✅ **Cleanup:** 16 resolved logs removed from Redis buffer

## Configuration

Edit `config.js` to customize behavior:

```javascript
// Buffer Handler
buffer.releaseRateMs: 500        // Check for incidents every 500ms
buffer.historyWindowSize: 100    // Keep 100-log history window

// Causal Signals (30+ patterns)
buffer.causalSignals: ["latency", "timeout", "OOM", "ENOSPC", ...]

// RAG Service
ai.temperature: 0.1              // 0=deterministic, 1=creative
ai.chatModel: "meta-llama/..."   // Change LLM model
```
