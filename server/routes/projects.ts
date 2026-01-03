import express from 'express';
import { ProjectModel } from '../models/Project.js';
import { Project } from '../../schema/project.js';
import { v4 as uuidv4 } from 'uuid';
import type { WithAuthProp } from '@clerk/clerk-sdk-node';

const router = express.Router();

// Helper
const getUserId = (req: express.Request) => (req as WithAuthProp<express.Request>).auth.userId!;

// GET /projects - List all projects for the logged-in user
router.get('/', async (req, res) => {
    try {
        const ownerId = getUserId(req);
        if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

        const projects = await ProjectModel.find({ ownerId });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET /projects/:id - Get a specific project (ensure ownership)
router.get('/:id', async (req, res) => {
    try {
        const ownerId = getUserId(req);
        const project = await ProjectModel.findOne({ id: req.params.id, ownerId });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// POST /projects - Create a new project
router.post('/', async (req, res) => {
    try {
        const ownerId = getUserId(req);
        const { title } = req.body;

        if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const newProject: Project = {
            id: uuidv4(),
            ownerId, // Set from auth token
            title,
            nodes: [],
            edges: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const project = new ProjectModel(newProject);
        await project.save();

        res.status(201).json(project);
    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT /projects/:id - Update a project
router.put('/:id', async (req, res) => {
    try {
        const ownerId = getUserId(req);
        const { id } = req.params;
        const updates = req.body;

        const project = await ProjectModel.findOneAndUpdate(
            { id, ownerId }, // Ensure ownership
            { ...updates, updatedAt: new Date().toISOString() },
            { new: true } // Return updated document
        );

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /projects/:id - Delete a project
router.delete('/:id', async (req, res) => {
    try {
        const ownerId = getUserId(req);
        const { id } = req.params;
        const result = await ProjectModel.findOneAndDelete({ id, ownerId }); // Ensure ownership

        if (!result) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
