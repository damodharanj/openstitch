import { describe, it, expect } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import { FormatRegistry } from '@sinclair/typebox';
import { User, Project, Node, ChatHistory } from './index.js';

// Register formats for testing
FormatRegistry.Set('email', (value) => true);
FormatRegistry.Set('date-time', (value) => true);

describe('Schema Verification', () => {
    it('should validate a valid User', () => {
        const user: User = {
            id: 'u1',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: new Date().toISOString()
        };
        expect(Value.Check(User, user)).toBe(true);
    });

    it('should validate a valid Node (StitchComponent)', () => {
        const node: Node = {
            id: 'n1',
            position: { x: 0, y: 0 },
            data: {
                component: {
                    html: '<div class="p-4">Hello</div>',
                    // css field removed per user request
                }
            }
        };
        expect(Value.Check(Node, node)).toBe(true);
    });

    it('should validate a valid Project', () => {
        const project: Project = {
            id: 'p1',
            ownerId: 'u1',
            title: 'My Project',
            nodes: [],
            edges: []
        };
        expect(Value.Check(Project, project)).toBe(true);
    });

    it('should validate valid ChatHistory', () => {
        const history: ChatHistory = [
            { id: 'm1', role: 'user', content: 'Hello', timestamp: Date.now() },
            { id: 'm2', role: 'assistant', content: 'Hi there', timestamp: Date.now() }
        ];
        expect(Value.Check(ChatHistory, history)).toBe(true);
    });

    it('should fail invalid User', () => {
        const invalidUser = { id: 'u2', name: 123 }; // Invalid name type and missing fields
        expect(Value.Check(User, invalidUser)).toBe(false);
    });
});
