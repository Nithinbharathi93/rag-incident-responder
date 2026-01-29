import express from 'express';
import multer from 'multer';
import { ingestDocument } from '../services/ingestor.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Keep PDF in RAM for fast processing

router.post('/', upload.single('manual'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF provided." });

    // Auto-ingest will now handle tag generation internally
    await ingestDocument(req.file.buffer, req.file.originalname);

    res.json({ 
      message: "Ingestion successful with auto-tagging", 
      file: req.file.originalname 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;