import mongoose from 'mongoose';
import { User } from '../../schema/user.js';

const userSchema = new mongoose.Schema<User>({
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    llmConfig: {
        activeProvider: {
            type: String,
            enum: ['openai-compatible'],
            default: 'openai-compatible'
        },
        activeModel: String,
        apiKey: String,
        baseUrl: String,
        systemPrompt: String,
    }
});

export const UserModel = mongoose.model<User>('User', userSchema);
