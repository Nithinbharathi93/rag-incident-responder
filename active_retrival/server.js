import express from 'express';
import { findResolvingDocuments } from './services/resolverService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.post('/api/v1/incidents/resolve', async (req, res) => {
    const { error, stack } = req.body;

    // Validation
    if (!error && !stack) {
        return res.status(400).json({ 
            success: false, 
            message: 'Bad Request: You must provide either an "error" or "stack" string.' 
        });
    }

    try {
        console.log(`[API] Received resolution request for error: ${error || 'Unknown'}`);
        
        // Fetch documents
        const resolvingData = await findResolvingDocuments(error, stack);
        
        res.status(200).json({
            success: true,
            data: resolvingData
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'An internal error occurred while fetching resolving documents.',
            details: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`[Server] Incident Resolver API running on http://localhost:${PORT}`);
});