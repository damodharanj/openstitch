import { Type, type Static } from '@sinclair/typebox';

// Define providers as a constant for reuse in UI
export const LLM_PROVIDERS = ['openai', 'anthropic', 'google', 'ollama', 'openrouter'] as const;

export const User = Type.Object({
  id: Type.String({ description: 'The unique identifier from Clerk (e.g., user_2k...)' }),
  email: Type.String({ format: 'email' }),
  name: Type.String(),
  image: Type.Optional(Type.String({ format: 'uri' })),
  llmConfig: Type.Optional(Type.Object({
    activeProvider: Type.Union(LLM_PROVIDERS.map(p => Type.Literal(p))),
    activeModel: Type.Optional(Type.String()),
    openai: Type.Optional(Type.Object({ apiKey: Type.String() })),
    anthropic: Type.Optional(Type.Object({ apiKey: Type.String() })),
    google: Type.Optional(Type.Object({ apiKey: Type.String() })),
    ollama: Type.Optional(Type.Object({ baseUrl: Type.String() })),
    openrouter: Type.Optional(Type.Object({ apiKey: Type.String() })),
    systemPrompt: Type.Optional(Type.String()),
  })),
  createdAt: Type.String({ format: 'date-time' }),
});

export type User = Static<typeof User>;
