import mongoose from 'mongoose';
import { ChatMessage } from '../../schema/chat.js';

// Define subdocuments for strict typing
const ChatMessageSchema = new mongoose.Schema<ChatMessage>({
    id: { type: String, required: true },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: { type: String, required: true },
    timestamp: { type: Number, required: true },
}, { _id: false });

export interface ChatDocument extends mongoose.Document {
    projectId: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatSchema = new mongoose.Schema<ChatDocument>({
    projectId: { type: String, required: true, unique: true },
    messages: { type: [ChatMessageSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const ChatModel = mongoose.model<ChatDocument>('Chat', ChatSchema);
