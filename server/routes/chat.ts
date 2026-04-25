import express from 'express';
import { ChatModel } from '../models/Chat.js';
import { ChatMessage, ChatRole, DEFAULT_SYSTEM_PROMPT } from '../../schema/chat.js';
import { v4 as uuidv4 } from 'uuid';
import { ProjectModel } from '../models/Project.js';
import { UserModel } from '../models/User.js';
import { decrypt } from '../utils/encryption.js';
import OpenAI from 'openai';
const router = express.Router();

// GET /chat/:projectId - Get chat history for a project
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const chat = await ChatModel.findOne({ projectId });

        if (!chat) {
            // Return empty history if chat doesn't exist yet
            return res.json([]);
        }

        res.json(chat.messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// DELETE /chat/:projectId - Clear chat history
router.delete('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        await ChatModel.findOneAndUpdate(
            { projectId },
            { $set: { messages: [] } },
            { new: true }
        );
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear chat history' });
    }
});

// POST /chat/message - Send a message
router.post('/message', async (req, res) => {
    try {
        const { projectId, content, role } = req.body;

        if (!projectId || !content) {
            return res.status(400).json({ error: 'projectId and content are required' });
        }

        // Default role to user if not provided
        const messageRole: ChatRole = role || 'user';

        const newMessage: ChatMessage = {
            id: uuidv4(),
            role: messageRole,
            content,
            timestamp: Date.now(),
        };

        let chat = await ChatModel.findOne({ projectId });

        if (!chat) {
            chat = new ChatModel({
                projectId,
                messages: [newMessage],
            });
        } else {
            chat.messages.push(newMessage);
            chat.updatedAt = new Date();
        }

        await chat.save();

        // --- Standardized OpenAI Compatibility ---
        // 1. Get Project to find owner
        const project = await ProjectModel.findOne({ id: projectId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // 2. Get User to find config
        const user = await UserModel.findOne({ id: project.ownerId });
        if (!user) {
            return res.status(404).json({ error: 'Project owner not found' });
        }

        const { activeProvider, activeModel, apiKey: encryptedKey, baseUrl } = user.llmConfig || {};

        // 3. Decrypt Key
        let apiKey = '';
        if (encryptedKey) {
            try {
                apiKey = decrypt(encryptedKey);
            } catch (e) {
                console.error('Failed to decrypt LLM key', e);
                return res.status(400).json({ error: 'Invalid API Key configuration' });
            }
        }

        // Normalize baseURL for common providers if necessary
        let normalizedBaseUrl = baseUrl || undefined;
        if (normalizedBaseUrl) {
            // Remove trailing slash
            normalizedBaseUrl = normalizedBaseUrl.replace(/\/$/, '');
            // If it's openrouter and missing /api/v1
            if (normalizedBaseUrl.includes('openrouter.ai') && !normalizedBaseUrl.endsWith('/api/v1')) {
                normalizedBaseUrl = 'https://openrouter.ai/api/v1';
            }
        }

        console.log(`Initializing OpenAI client with baseURL: ${normalizedBaseUrl || 'default'}`);

        // 4. Initialize OpenAI Client
        const openai = new OpenAI({
            apiKey: apiKey || 'no-key-provided',
            baseURL: normalizedBaseUrl,
        });

        const systemPrompt = user.llmConfig?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
        let assistantContent = '';

        try {
            const messagesForAI: any[] = chat.messages
                .filter(m => m.content && String(m.content).trim() !== '')
                .map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user'),
                    content: String(m.content)
                }));

            console.log(`Sending messages to ${activeProvider || 'openai'} (${activeModel || 'default'}):`, JSON.stringify(messagesForAI, null, 2));

            const completion = await openai.chat.completions.create({
                model: activeModel || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messagesForAI
                ],
                temperature: 0.7,
            });

            console.log('LLM RAW RESPONSE:', JSON.stringify(completion, null, 2));

            const text = completion?.choices?.[0]?.message?.content;
            if (text) {
                assistantContent = text;
            } else {
                console.error('LLM response missing text:', JSON.stringify(completion, null, 2));
                throw new Error('LLM provider returned an empty or malformed response.');
            }
        } catch (genError: any) {
            console.error('Generation error:', genError);
            assistantContent = `Error generating response: ${genError.message || 'Unknown error'}`;
        }

        const assistantMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now(),
        };

        chat.messages.push(assistantMessage);
        chat.updatedAt = new Date();
        await chat.save();

        res.status(201).json(chat.messages);
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: 'Failed to send message',
            details: error.message || 'Unknown error'
        });
    }
});

export default router;
