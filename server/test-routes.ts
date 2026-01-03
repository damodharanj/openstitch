import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testRoutes() {
    console.log('Starting route tests...');

    try {
        // 1. Health Check
        console.log('\n--- Testing Health Check ---');
        const health = await fetch(`${BASE_URL}/`);
        console.log('Health Status:', health.status);
        console.log('Response:', await health.text());

        // 2. Create Project
        console.log('\n--- Testing Create Project ---');
        const newProject = {
            ownerId: 'test-user-1',
            title: 'Test Project'
        };
        const createRes = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProject)
        });
        const createdProject = await createRes.json() as any;
        console.log('Created Project:', createdProject);

        if (!createdProject.id) throw new Error('Create project failed');
        const projectId = createdProject.id;

        // 3. Get All Projects
        console.log('\n--- Testing Get All Projects ---');
        const listRes = await fetch(`${BASE_URL}/projects`);
        const projects = await listRes.json() as any[];
        console.log('Projects Count:', projects.length);

        // 4. Update Project
        console.log('\n--- Testing Update Project ---');
        const updateRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Updated Test Project' })
        });
        const updatedProject = await updateRes.json() as any;
        console.log('Updated Project Title:', updatedProject.title);

        // 5. Chat - Send Message
        console.log('\n--- Testing Chat Send Message ---');
        const message = {
            projectId,
            content: 'Hello World',
            role: 'user'
        };
        const chatRes = await fetch(`${BASE_URL}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
        const chatHistory = await chatRes.json() as any[];
        console.log('Chat History Validation:', chatHistory.length === 1 && chatHistory[0].content === 'Hello World');

        // 6. Chat - Get History
        console.log('\n--- Testing Get Chat History ---');
        const historyRes = await fetch(`${BASE_URL}/chat/${projectId}`);
        const history = await historyRes.json() as any[];
        console.log('History fetched, count:', history.length);

        // 7. Delete Project
        console.log('\n--- Testing Delete Project ---');
        const deleteRes = await fetch(`${BASE_URL}/projects/${projectId}`, {
            method: 'DELETE'
        });
        console.log('Delete Status:', deleteRes.status);

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testRoutes();
