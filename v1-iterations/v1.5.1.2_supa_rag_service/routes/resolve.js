import express from 'express';
import { resolveIncident } from '../services/resolver.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { story } = req.body; // Expecting { "story": ["line1", "line2"] }
    
    if (!story || !Array.isArray(story)) {
      return res.status(400).json({ error: "Invalid story format." });
    }

    const result = await resolveIncident(story);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;