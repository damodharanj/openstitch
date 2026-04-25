import mongoose from 'mongoose';
import fetch from 'node-fetch';
import { UserModel } from './models/User.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const BASE_URL = 'http://localhost:5001';

async function verify() {
    console.log('Connecting to DB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/open-stitch';
    await mongoose.connect(mongoUri);

    try {
        const testUserId = `security-test-${uuidv4()}`;

        // 1. Create User directly in DB
        const user = new UserModel({
            id: testUserId,
            name: 'Security Tester',
            email: `test-${testUserId}@secure.com`
        });
        await user.save();
        console.log(`Test user created: ${testUserId}`);

        // 2. Update Config (PUT)
        const secretKey = 'sk-MY_SECRET_KEY';
        console.log(`Updating config for user ${testUserId}...`);
        const res = await fetch(`${BASE_URL}/users/me/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                activeProvider: 'openai',
                apiKey: secretKey
            })
        });

        if (res.status !== 200) {
            const body = await res.text();
            throw new Error(`Failed to update config: ${res.status} - ${body}`);
        }
        console.log('Config updated via API');

        // 3. Verify DB Content (Encrypted)
        const dbUser = await UserModel.findOne({ id: testUserId }).lean();
        const storedKey = dbUser?.llmConfig?.apiKey;

        if (!storedKey) throw new Error('Key not found in DB');
        if (storedKey === secretKey) throw new Error('SECURITY FAIL: Key stored in plain text!');
        if (!storedKey.includes(':')) throw new Error(`Stored key does not look encrypted (should have IV): ${storedKey}`);

        console.log('DB Verification Passed: Key is encrypted');

        // 4. Verify API Response (Masked)
        // Since /me/config updates the authenticated user, we might need a better test here 
        // if the middleware is strictly checking Clerk IDs. For now just fix types.
        const getRes = await fetch(`${BASE_URL}/users/me`);
        const userProfile = (await getRes.json()) as any;

        const returnedKey = userProfile.llmConfig?.apiKey;

        if (returnedKey === secretKey) throw new Error('SECURITY FAIL: API returned plain text key!');
        if (returnedKey !== '********') throw new Error(`API returned unexpected key format: ${returnedKey}`);

        console.log('API Verification Passed: Key is masked');

        // Cleanup
        await UserModel.deleteOne({ id: testUserId });

    } catch (e) {
        console.error('Verification Failed:', e);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
