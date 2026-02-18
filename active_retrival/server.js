import express from 'express';
import { getFullErrorDocs } from './controller.js';

const app = express();
app.use(express.json());

app.post('/get-full-docs', async (req, res) => {
    const { stack } = req.body;

    if (!stack) {
        return res.status(400).json({ error: "Please provide a 'stack' (e.g., node, react)." });
    }

    try {
        const result = await getFullErrorDocs(stack);
        res.json({
            success: true,
            stack: stack,
            url: result.source,
            full_documentation: result.document
        });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

app.listen(3000, () => console.log("System Ready: http://localhost:3000/get-full-docs"));