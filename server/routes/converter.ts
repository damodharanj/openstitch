import express from 'express';
import { convertHtmlToSvg } from '../utils/convertToSvg.js';

const router = express.Router();

router.post('/svg', async (req, res) => {
    try {
        const { html } = req.body;

        if (!html) {
            res.status(400).json({ error: 'HTML content is required' });
            return;
        }

        const svg = await convertHtmlToSvg(html);
        res.json({ svg });
    } catch (error) {
        console.error('Error converting HTML to SVG:', error);
        res.status(500).json({ error: 'Failed to convert HTML to SVG' });
    }
});

export default router;
