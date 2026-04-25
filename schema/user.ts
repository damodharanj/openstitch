import { Type, type Static } from '@sinclair/typebox';

// Define providers as a constant for reuse in UI
export const LLM_PROVIDERS = ['openai-compatible'] as const;

export const User = Type.Object({
  id: Type.String({ description: 'The unique identifier from Clerk (e.g., user_2k...)' }),
  email: Type.String({ format: 'email' }),
  name: Type.String(),
  image: Type.Optional(Type.String({ format: 'uri' })),
  llmConfig: Type.Optional(Type.Object({
    activeProvider: Type.Union(LLM_PROVIDERS.map(p => Type.Literal(p))),
    activeModel: Type.Optional(Type.String()),
    apiKey: Type.Optional(Type.String()),
    baseUrl: Type.Optional(Type.String()),
    systemPrompt: Type.Optional(Type.String()),
  })),
  createdAt: Type.String({ format: 'date-time' }),
});


export type User = Static<typeof User>;
