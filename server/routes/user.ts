import express from 'express';
import { UserModel } from '../models/User.js';
import { encrypt } from '../utils/encryption.js';
import type { WithAuthProp } from '@clerk/clerk-sdk-node';

const router = express.Router();
const MASKED_KEY = '********';

// Helper to get user ID from Clerk auth
// Explicitly cast req to WithAuthProp<express.Request> to satisfy TS
const getUserId = (req: express.Request) => (req as WithAuthProp<express.Request>).auth.userId!;

import { clerkClient } from '@clerk/clerk-sdk-node';

// ... (existing imports)

// GET /users/me - Get my profile (syncs logic)
router.get('/me', async (req, res) => {
    try {
        const clerkId = getUserId(req);
        if (!clerkId) return res.status(401).json({ error: 'Unauthorized' });

        let user = await UserModel.findOne({ id: clerkId }).lean();

        // Sync: Create user if they don't exist in our DB yet
        if (!user) {
            try {
                const clerkUser = await clerkClient.users.getUser(clerkId);
                const email = clerkUser.emailAddresses[0]?.emailAddress || '';
                const name = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : clerkUser.username || 'New User';

                const newUser = new UserModel({
                    id: clerkId,
                    email,
                    name,
                    createdAt: new Date().toISOString(),
                });
                await newUser.save();
                user = newUser.toObject();
            } catch (clerkError) {
                console.error("Failed to fetch user from Clerk:", clerkError);
                return res.status(500).json({ error: 'Failed to sync user identity' });
            }
        }

        // Mask sensitive data
        if (user.llmConfig) {
            if (user.llmConfig.apiKey) user.llmConfig.apiKey = MASKED_KEY;
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// PUT /users/me/config - Update LLM config
router.put('/me/config', async (req, res) => {
    try {
        const id = getUserId(req);
        const {
            activeProvider,
            apiKey,
            baseUrl,
            activeModel,
            systemPrompt
        } = req.body;

        const user = await UserModel.findOne({ id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.llmConfig) {
            user.llmConfig = { activeProvider: activeProvider || 'openai' };
        }

        if (activeProvider) user.llmConfig.activeProvider = activeProvider;
        if (activeModel) user.llmConfig.activeModel = activeModel;
        if (baseUrl !== undefined) user.llmConfig.baseUrl = baseUrl;
        if (systemPrompt !== undefined) user.llmConfig.systemPrompt = systemPrompt;

        if (apiKey && apiKey !== MASKED_KEY) {
            user.llmConfig.apiKey = encrypt(apiKey);
        }

        await user.save();
        res.json({ message: 'Configuration updated successfully' });

    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed' });
    }
});


export default router;
