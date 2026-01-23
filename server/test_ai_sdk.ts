
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import fs from 'fs';
import dotenv from 'dotenv';


dotenv.config();

const runTest = async () => {
    try {
        const apiKey = process.env.OPENROUTER_API_KEY;

        console.log('Using OpenRouter with provided key...');

        const openrouter = createOpenAI({
            apiKey: apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        });

        const model = openrouter('openai/gpt-3.5-turbo');

        const payload = [
            { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
            { role: 'assistant', content: [{ type: 'text', text: 'Hi there!' }] }
        ];

        console.log('Using MANUAL Simple Payload');
        console.log('Payload Length:', payload.length);

        console.log('Calling generateText via OpenRouter...');
        const result = await generateText({
            model,
            messages: payload as any,
        });

        console.log('Success!');
        console.log('Response:', result.text);

    } catch (error) {
        console.error('Test failed:', JSON.stringify(error, null, 2));
    }
};

runTest();
