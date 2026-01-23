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
        let assistantContent = '';

        try {
            const messagesForAI = chat.messages
                .filter(m => m.content && m.content.trim() !== '')
                .map(m => {
                    // Ensure role is one of the allowed types
                    let role: 'user' | 'assistant' | 'system' = 'user';
                    if (m.role === 'assistant') role = 'assistant';
                    else if (m.role === 'system') role = 'system';

                    // Strict content sanitization to handle potential dirty data (e.g. arrays)
                    let cleanContent = '';
                    const rawContent = m.content as any;
                    if (typeof rawContent === 'string') {
                        cleanContent = rawContent;
                    } else if (Array.isArray(rawContent)) {
                        // If it's an array (dirty data), join valid parts
                        cleanContent = rawContent
                            .map((c: any) => typeof c === 'string' ? c : JSON.stringify(c))
                            .join(' ');
                    } else if (rawContent) {
                        cleanContent = String(rawContent);
                    }

                    return {
                        role,
                        content: cleanContent || '', // Ensure content is string
                    };
                });

            console.log('Sending messages to AI:', JSON.stringify(messagesForAI, null, 2));

            const result = await generateText({
                model,
                system: systemPrompt,
                messages: messagesForAI,
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
