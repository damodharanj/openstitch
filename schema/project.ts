import { Type, type Static } from '@sinclair/typebox';
import { Node } from './node.js';

export const Edge = Type.Object({
    id: Type.String(),
    source: Type.String(),
    target: Type.String(),
    sourceHandle: Type.Optional(Type.String()),
    targetHandle: Type.Optional(Type.String()),
});

export type Edge = Static<typeof Edge>;

export const Project = Type.Object({
    id: Type.String(),
    ownerId: Type.String(),
    title: Type.String(),
    nodes: Type.Array(Node),
    edges: Type.Array(Edge),
    viewport: Type.Optional(Type.Object({
        x: Type.Number(),
        y: Type.Number(),
        zoom: Type.Number(),
    })),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
});

export type Project = Static<typeof Project>;
