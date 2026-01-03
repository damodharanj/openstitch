import { connectDB } from './db.js';
import { UserModel } from './models/User.js';
import { ProjectModel } from './models/Project.js';
import mongoose from 'mongoose';

const test = async () => {
    console.log('Connecting to DB...');
    await connectDB();
    console.log('Connected.');

    // Cleanup
    await UserModel.deleteMany({ email: 'test@example.com' });
    await ProjectModel.deleteMany({ title: 'Test Project' });

    console.log('Creating User...');
    const user = await UserModel.create({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
    });
    console.log('User created:', user.id);

    console.log('Creating Project...');
    const project = await ProjectModel.create({
        id: 'proj-123',
        ownerId: user.id,
        title: 'Test Project',
        nodes: [
            {
                id: 'node-1',
                position: { x: 0, y: 0 },
                data: {
                    component: {
                        html: '<div class="p-4 bg-blue-500">Hello</div>',
                        width: 100,
                        height: 100
                    },
                    label: 'Test Node'
                }
            }
        ],
        edges: []
    });
    console.log('Project created:', project.id);

    console.log('Fetching Project...');
    const fetchedProject = await ProjectModel.findOne({ id: 'proj-123' });
    if (!fetchedProject) throw new Error('Project not found');
    console.log('Project fetched successfully with', fetchedProject.nodes.length, 'nodes');

    // Expected Validation Error Test
    console.log('Testing Validation Error...');
    try {
        await UserModel.create({
            id: 'bad-user',
            // Missing email and name
        } as any);
        console.error('Validation check FAILED: Should have thrown error');
    } catch (e) {
        console.log('Validation check PASSED:', (e as Error).message);
    }

    console.log('Done.');
    await mongoose.connection.close();
};

test().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
