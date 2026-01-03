import mongoose from 'mongoose';
import { Project, Edge } from '../../schema/project.js';
import { Node } from '../../schema/node.js';

// Define subdocuments for strict typing and validation if needed
const StitchComponentSchema = new mongoose.Schema({
    html: { type: String, required: true },
    width: Number,
    height: Number,
}, { _id: false });

const NodeDataSchema = new mongoose.Schema({
    component: StitchComponentSchema,
    label: String,
}, { _id: false });

const NodeSchema = new mongoose.Schema<Node>({
    id: { type: String, required: true },
    position: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
    },
    data: { type: NodeDataSchema, required: true },
    type: String,
    width: Number,
    height: Number,
}, { _id: false });

const EdgeSchema = new mongoose.Schema<Edge>({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: String,
    targetHandle: String,
}, { _id: false });

const projectSchema = new mongoose.Schema<Project>({
    id: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    title: { type: String, required: true },
    nodes: { type: [NodeSchema], default: [] },
    edges: { type: [EdgeSchema], default: [] },
    viewport: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        zoom: { type: Number, default: 1 },
    },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
}, {
    toJSON: { virtuals: false },
    id: false
});

export const ProjectModel = mongoose.model<Project>('Project', projectSchema);
