
import { z } from 'zod';
import { createOllama } from 'ollama-ai-provider';
import { anthropic } from '@ai-sdk/anthropic';

console.log('Successfully imported modules.');
// 3.25.76 is technically a v3 version but might have some v4 characteristics or be a bridge.
// We just want to ensure it doesn't throw on import or basic usage.

try {
    const schema = z.object({ name: z.string() });
    console.log('Zod schema creation successful.');

    const o = createOllama();
    const a = anthropic('claude-3-opus-20240229');

    console.log('Providers initialized without immediate error.');
} catch (e) {
    console.error('Error during test:', e);
    process.exit(1);
}
