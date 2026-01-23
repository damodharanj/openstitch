import express from 'express';
import fs from 'fs';
import { ChatModel } from '../models/Chat.js';
import { ChatMessage, ChatRole, DEFAULT_SYSTEM_PROMPT } from '../../schema/chat.js';
import { v4 as uuidv4 } from 'uuid';
import { ProjectModel } from '../models/Project.js';
import { UserModel } from '../models/User.js';
import { decrypt } from '../utils/encryption.js';
import { generateText } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic, createAnthropic } from '@ai-sdk/anthropic';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider';
import { z } from 'zod';

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

        // --- Secure AI Model Initialization ---
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

        // 3. Determine Provider and Key
        const activeProvider = user.llmConfig?.activeProvider || 'openai';
        const activeModel = user.llmConfig?.activeModel;
        let model: any;

        if (activeProvider === 'openai') {
            const rawKey = user.llmConfig?.openai?.apiKey;
            if (!rawKey) throw new Error('OpenAI API key not configured');
            let apiKey = '';
            try {
                apiKey = decrypt(rawKey);
            } catch (e) {
                console.error('Failed to decrypt OpenAI key', e);
                return res.status(400).json({ error: 'Invalid API Key configuration' });
            }

            const openaiInstance = createOpenAI({ apiKey });
            model = openaiInstance(activeModel || 'gpt-4o');

        } else if (activeProvider === 'anthropic') {
            const rawKey = user.llmConfig?.anthropic?.apiKey;
            if (!rawKey) throw new Error('Anthropic API key not configured');
            let apiKey = '';
            try {
                apiKey = decrypt(rawKey);
            } catch (e) {
                console.error('Failed to decrypt Anthropic key', e);
                return res.status(400).json({ error: 'Invalid API Key configuration' });
            }

            const anthropicInstance = createAnthropic({ apiKey });
            model = anthropicInstance(activeModel || 'claude-3-opus-20240229');

        } else if (activeProvider === 'google') {
            const rawKey = user.llmConfig?.google?.apiKey;
            if (!rawKey) throw new Error('Google API key not configured');
            let apiKey = '';
            try {
                apiKey = decrypt(rawKey);
            } catch (e) {
                console.error('Failed to decrypt Google key', e);
                return res.status(400).json({ error: 'Invalid API Key configuration' });
            }

            const googleInstance = createGoogleGenerativeAI({ apiKey });
            model = googleInstance(activeModel || 'models/gemini-pro');

        } else if (activeProvider === 'ollama') {
            const baseUrl = user.llmConfig?.ollama?.baseUrl || 'http://localhost:11434/api';

            const ollamaInstance = createOllama({ baseURL: baseUrl });
            model = ollamaInstance(activeModel || 'llama3');

        } else if (activeProvider === 'openrouter') {
            const rawKey = user.llmConfig?.openrouter?.apiKey;
            if (!rawKey) throw new Error('OpenRouter API key not configured');
            let apiKey = '';
            try {
                apiKey = decrypt(rawKey);
            } catch (e) {
                console.error('Failed to decrypt OpenRouter key', e);
                return res.status(400).json({ error: 'Invalid API Key configuration' });
            }

            const openrouter = createOpenAI({
                apiKey,
                baseURL: 'https://openrouter.ai/api/v1'
            });
            model = openrouter(activeModel || 'openai/gpt-4o');
        } else {
            return res.status(400).json({ error: `Provider ${activeProvider} not supported` });
        }

        // Generate assistant response using AI SDK
        const systemPrompt = user.llmConfig?.systemPrompt || DEFAULT_SYSTEM_PROMPT;

        const messagesPayload = chat.messages.reduce((acc: any[], m) => {
            let content = m.content;

            // Aggressive sanitization: Force EVERYTHING to be a string
            let safeContent = '';

            try {
                if (typeof content === 'string') {
                    safeContent = content;
                } else if (Array.isArray(content)) {
                    // Start by mapping to string representations
                    safeContent = content.map((p: any) => {
                        if (typeof p === 'string') return p;
                        if (p && typeof p === 'object') {
                            if (p.text) return p.text;
                            // Fallback for other object types in array
                            return JSON.stringify(p);
                        }
                        return String(p);
                    }).join('\n');
                } else if (content && typeof content === 'object') {
                    // Handle single object case (rare but possible based on DB inspection)
                    safeContent = JSON.stringify(content);
                } else {
                    safeContent = String(content || '');
                }
            } catch (e) {
                console.error('Error sanitizing message content:', e);
                safeContent = 'Error processing content';
            }

            const role = m.role === 'user' ? 'user' : 'assistant';

            const lastMessage = acc[acc.length - 1];
            if (lastMessage && lastMessage.role === role) {
                // Coalesce with previous message of same role
                lastMessage.content += '\n\n' + safeContent;
            } else {
                acc.push({
                    role,
                    content: safeContent,
                });
            }
            return acc;
        }, [] as any[])
            .filter((m: any) => m.content && m.content.trim().length > 0); // Filter empty messages

        // Strict final mapping to ensuring purely fresh objects
        const strictPayload = messagesPayload
            .filter((m: any) => m.content && String(m.content).trim().length > 0)
            .map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: String(m.content)
            }));

        let assistantContent = '';

        try {


            // console.log('[DEBUG] Strict payload prepared with', strictPayload.length, 'messages');
            try {
                fs.writeFileSync('debug_strict_payload.json', JSON.stringify(strictPayload, null, 2));
            } catch (e) { }

            const result = await generateText({
                model,
                system: String(systemPrompt || ''), // Ensure primitive string
                messages: strictPayload as any,
            });

            assistantContent = result.text;
        } catch (genError: any) {
            console.error('Generation error:', genError);
            // Non-fatal, we will just have an empty assistant response if it fails entirely
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
