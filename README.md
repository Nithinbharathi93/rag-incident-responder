# 🛡️ Ops-Sentinel: AI-Powered Autonomous Incident Responder

**Ops-Sentinel** is a full-stack Site Reliability Engineering (SRE) tool that monitors live logs and utilizes **Retrieval-Augmented Generation (RAG)** to provide instant, grounded remediation steps for system crashes.

## 🚀 Key Features

* **Real-time Log Observation**: Monitors a Redis-backed sliding window for `FATAL` log signals.
* **Forensic Backtracking**: Automatically reconstructs the "causal chain" of events leading up to a crash.
* **Autonomous RAG Brain**: Uses **Llama-3.1-8B** and **Supabase Vector Storage** to match incidents against technical playbooks.
* **Semantic Metadata Filtering**: Implements auto-tagging to ensure the AI only searches relevant documentation, reducing latency and hallucinations.
* **Grounded Remediation**: Provides specific, battle-tested commands (e.g., `redis-cli CONFIG SET...`) directly from ingested PDFs.

## 🛠️ Tech Stack

* **Backend**: Node.js (ES Modules)
* **Storage**: Redis (Hot Buffer) & Supabase (Vector Store / PostgreSQL)
* **AI/ML**: Hugging Face Inference API (`Llama-3.1-8B-Instruct` & `all-MiniLM-L6-v2`)
* **Tools**: Multer (File Handling), LangChain (Text Splitting), Axios

## 📂 Project Structure

* `bufferhandler.js`: The real-time log observer and incident detector.
* `server.js`: The RAG microservice hosting `/ingest` and `/resolve` endpoints.
* `services/`: Contains the logic for document ingestion and incident resolution.
* `controllers/`: Manages AI interactions (embeddings/chat) and document metadata.
* `utils/`: PDF text extraction and recursive character chunking.

## 📖 How It Works

1. **Ingestion**: Documentation (PDFs) is uploaded, chunked, vectorized, and **auto-tagged** via LLM into Supabase.
2. **Detection**: `bufferhandler.js` watches a Redis list for `FATAL` logs.
3. **Backtracking**: On a crash, the system pulls the last 50 logs to find "Causal Signals" (WARNs/Errors).
4. **Resolution**: The forensic story is sent to the RAG service, which performs a tag-filtered vector search to find the correct fix.
