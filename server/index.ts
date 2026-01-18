import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './db.js';
import projectRoutes from './routes/projects.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';
import converterRoutes from './routes/converter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

import { requireAuth } from './middleware/auth.js';

// Routes
// Public routes can remain unprotected or use withAuth if needed
// @ts-expect-error - Express types mismatch between middleware and app
app.use('/api/projects', requireAuth(), projectRoutes);
// @ts-expect-error - Express types mismatch between middleware and app
app.use('/api/chat', requireAuth(), chatRoutes);
// @ts-expect-error - Express types mismatch between middleware and app
app.use('/api/users', requireAuth(), userRoutes);
// @ts-expect-error - Express types mismatch between middleware and app
app.use('/api/convert', requireAuth(), converterRoutes);

// Basic health check
app.get('/health', (req, res) => {
    res.send('OpenStitch API is running');
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const __dirname = path.resolve();
    app.use(express.static(path.join(__dirname, 'client/dist')));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
    });
}

const startServer = async () => {
    console.log('Starting server...');
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Mongo URI defined: ${!!process.env.MONGO_URI}`);
    });

    try {
        await connectDB();
    } catch (error) {
        console.error('Failed to connect to DB:', error);
    }
};

startServer();
// Forced reload
