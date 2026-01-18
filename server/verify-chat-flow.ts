import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { UserModel } from './models/User.js';
import { ProjectModel } from './models/Project.js';

dotenv.config();

const BASE_URL = 'http://localhost:5002';
const TEST_KEY = 'sk-proj-INVALID-KEY-FOR-TESTING-FLOW';

async function verifyFlow() {
    console.log('Connecting to DB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/open-stitch';
    await mongoose.connect(mongoUri);

    try {
        const testId = `flow-test-${uuidv4()}`;
        const userId = `user-${testId}`;
        const projectId = `proj-${testId}`;

        console.log(`Setting up test data for ${testId}...`);

        // 1. Create User via DB (simulating auth cleanup)
        const user = new UserModel({
            id: userId,
            name: 'Flow Tester',
            email: `${testId}@test.com`
        });
        await user.save();

        // 2. Set API Key via API (Test Encryption Flow)
        console.log('Setting API Key...');
        const configRes = await fetch(`${BASE_URL}/users/${userId}/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activeProvider: 'openai',
                openaiKey: TEST_KEY
            })
        });
        if (configRes.status !== 200) throw new Error('Failed to set config');

        // 3. Create Project via API (Test Project Ownership)
        // Wait, Project API requires ownerId in body currently? 
        // Checking routes/projects.ts: "const { ownerId, title } = req.body;"
        console.log('Creating Project...');
        const projRes = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ownerId: userId,
                title: 'Flow Test Project'
            })
        });
        const project = await projRes.json();
        // @ts-ignore
        if (!project.id) throw new Error('Failed to create project');
        // @ts-ignore
        const createdProjectId = project.id;

        // 4. Send Chat Message (The Test)
        console.log('Sending Chat Message...');
        const chatRes = await fetch(`${BASE_URL}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: createdProjectId,
                content: 'Hello, are you there?',
                role: 'user'
            })
        });

        const status = chatRes.status;
        const responseData = await chatRes.json();
        console.log(`Chat Response Status: ${status}`);
        console.log('Chat Response Body:', responseData);

        // We EXPECT a 500 error because the key is invalid. 
        // But we want to see that it tried to use OUR key.
        // The error details should come from OpenAI.

        // @ts-ignore
        if (status === 500 && responseData.details) {
            // @ts-ignore
            const details = responseData.details;
            if (details.includes('Incorrect API key provided') || details.includes('401')) {
                console.log('SUCCESS: Server attempted to use the provided API key!');
            } else {
                console.warn('WARNING: Received 500 but error message does not explicitly confirm key usage. Check logs.');
            }
        } else if (status === 201) {
            console.error('FAILURE: Request succeeded? That means it used a valid key (maybe system default?) instead of our invalid one!');
        } else {
            console.error('FAILURE: Unexpected status code.');
        }

        // Cleanup
        await UserModel.deleteOne({ id: userId });
        await ProjectModel.deleteOne({ id: createdProjectId });

    } catch (e) {
        console.error('Flow Verification Failed:', e);
    } finally {
        await mongoose.disconnect();
    }
}

verifyFlow();
