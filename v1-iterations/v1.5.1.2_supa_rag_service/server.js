import express from 'express';
import ingestRouter from './routes/ingest.js';
import resolveRouter from './routes/resolve.js';

const app = express();
app.use(express.json()); // For /resolve JSON body

// Routes
app.use('/ingest', ingestRouter);
app.use('/resolve', resolveRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🛡️ Ops-Sentinel RAG Service running on http://localhost:${PORT}`);
});