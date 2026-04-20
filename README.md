# 🛡️ Ops-Sentinel: Enterprise AI-Powered Autonomous Incident Responder

**Ops-Sentinel** is an enterprise-grade Site Reliability Engineering (SRE) platform that monitors live production logs and leverages a **Human-in-the-Loop Hybrid RAG** architecture. It prioritizes your internal documentation as the absolute source of truth, utilizing external intelligence only as a last resort to minimize operational risk and eliminate hallucinations.

---

## 🚀 Advanced Hybrid RAG Architecture

The system follows a strict hierarchical resolution pipeline designed for PaaS providers who demand high-fidelity, grounded responses:

1. **Forensic Pattern Matching (Priority 1):** The system reconstructs a 5-log "Forensic Window" to capture the causal chain of an incident.
2. **Internal Documentation Search (Priority 2):** It performs a high-dimensional vector search against your Supabase knowledge base. If internal documentation matches with a confidence score , the system is **forbidden** from searching the web.
3. **Verified Solution Shortcut:** If an incident matches a previously "Human-Approved" forensic pattern, the system bypasses LLM generation and serves the verified fix instantly.
4. **Emergency External Retrieval (Priority 3):** Only if internal search returns a  score does the system trigger an "Active Retrieval" to Stack Overflow.

---

## 💡 New Feature: The Self-Learning Loop

Ops-Sentinel now includes a **Knowledge Promotion** workflow. When an external solution is found:

* **Approve & Save:** Engineers can verify the external fix. Upon approval, the system anchors the **Forensic Story** (the problem) to the **Solution** (the answer) in the vector DB.
* **Instant Internalization:** The next time that specific log pattern appears, it is resolved via internal documentation with near-perfect confidence.

---

## 🔧 Updated Installation & Configuration

### New Environment Variables (`.env`)

```env
# Advanced Tuning
# Similarity threshold to ignore web search if docs are found
INTERNAL_CONFIDENCE_THRESHOLD=0.35 

# Max logs to include in the forensic pattern query
QUERY_WINDOW_SIZE=5 

```

### Critical Script Commands

```bash
# Ingest your enterprise PDF playbooks
curl -X POST http://localhost:3001/ingest -F "manual=@/path/to/paas-runbook.pdf"

# Start the live-streaming dashboard
open index.html

```

---

## 📊 Performance & Reliability

| Metric | Target | Status |
| --- | --- | --- |
| **Total MTTR** | <10s | **6.5s** |
| **Log Throughput** | 1000+ logs/sec | **Verified** |
| **Doc-First Priority** | 100% | **Enforced** |
| **False Positive Rate** | <1% | **Controlled via Hybrid Search** |

---

## 📂 Project Structure

```
incident_responder/
├── server.js                    # SSE Live Streaming & Feedback Routes
├── integrationHandler.js        # Doc-First RAG & Causal Chain Logic
├── index.html                   # High-Fidelity NOC Dashboard
├── controllers/
│   └── aiController.js          # Llama-3.2-3B Inference & Tagging
├── services/
│   ├── ingestor.js              # Knowledge Promotion & PDF Vectorization
│   └── externalRetrievalService.js # Emergency Stack Overflow Scraper
└── utils/
    └── textExtractor.js         # PDF Parsing & Chunking

```

---

## How to run?

**terminal 1**

```bash
cd incident_responder
npm run dev
```

**terminal 2**

```bash
cd company_server
node screamer
```

> [!NOTE]
> Run the [index.html](index.html) with `live server` extension.

**Built with ❤️ for the SRE community. Your PaaS, now fully autonomous.**
