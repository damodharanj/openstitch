
import dotenv from 'dotenv';
import { generateText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

dotenv.config();

async function run() {
    console.log('--- Starting Isolation Test ---');

    // Use OpenRouter as requested
    const apiKey = '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';
    const openai = createOpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1'
    });
    const model = openai('openai/gpt-4o');

    const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there! How can I help you?' },
        { role: 'user', content: 'What is 2+2?' }
    ];

    console.log('Testing with messages:', JSON.stringify(messages, null, 2));

    try {
        // cast messages to any because strict Typescript might complain, 
        // but we want to see runtime behavior.
        const result = await generateText({
            model,
            messages: messages as any,
        });

        console.log('Success! Result:', result.text);
    } catch (error: any) {
        console.error('FAILED with error:', error);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
    }
}

run().catch(console.error);
