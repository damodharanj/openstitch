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
            if (user.llmConfig.openai?.apiKey) user.llmConfig.openai.apiKey = MASKED_KEY;
            if (user.llmConfig.anthropic?.apiKey) user.llmConfig.anthropic.apiKey = MASKED_KEY;
            if (user.llmConfig.google?.apiKey) user.llmConfig.google.apiKey = MASKED_KEY;
            if (user.llmConfig.openrouter?.apiKey) user.llmConfig.openrouter.apiKey = MASKED_KEY;
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
            openai,
            anthropic,
            google,
            ollama,
            openrouter,
            activeModel
        } = req.body;

        const user = await UserModel.findOne({ id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!user.llmConfig) {
            user.llmConfig = { activeProvider: activeProvider || 'openai' };
        }

        if (activeProvider) user.llmConfig.activeProvider = activeProvider;
        if (activeModel) user.llmConfig.activeModel = activeModel;

        const encryptKey = (key: string | undefined, currentObj: any) => {
            if (key && key !== MASKED_KEY) {
                return { apiKey: encrypt(key) };
            }
            return currentObj; // Keep existing
        };

        if (openai?.apiKey) user.llmConfig.openai = encryptKey(openai.apiKey, user.llmConfig.openai);
        if (anthropic?.apiKey) user.llmConfig.anthropic = encryptKey(anthropic.apiKey, user.llmConfig.anthropic);
        if (google?.apiKey) user.llmConfig.google = encryptKey(google.apiKey, user.llmConfig.google);
        if (openrouter?.apiKey) user.llmConfig.openrouter = encryptKey(openrouter.apiKey, user.llmConfig.openrouter);

        if (ollama?.baseUrl) {
            if (!user.llmConfig.ollama) user.llmConfig.ollama = { baseUrl: '' };
            user.llmConfig.ollama.baseUrl = ollama.baseUrl;
        }

        await user.save();
        res.json({ message: 'Configuration updated successfully' });

    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed' });
    }
});


export default router;
