import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';
// IV length for aes-256-cbc is 16 bytes
const IV_LENGTH = 16;

const getKey = (): Buffer => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    if (key.length !== 64) { // 32 bytes in hex is 64 chars
        // Fallback if user provides raw string of 32 chars? 
        // For security, strict hex string of 32 bytes is better.
        if (key.length === 32) {
            return Buffer.from(key);
        }
        throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters) or 32-byte raw string');
    }
    return Buffer.from(key, 'hex');
};

export const encrypt = (text: string): string => {
    if (!text) return text;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = getKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', ENCODING);
        encrypted += cipher.final(ENCODING);

        // Return IV + Encrypted text to allow decryption
        return `${iv.toString(ENCODING)}:${encrypted}`;
    } catch (error) {
        console.error('Encryption failed', error);
        throw new Error('Failed to encrypt data');
    }
};

export const decrypt = (text: string): string => {
    if (!text) return text;

    try {
        const parts = text.split(':');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            // If it's not in our format, return as is or error. 
            // Returning as-is might be dangerous if we expect everything to be encrypted. 
            // But for migration safety or robust handling:
            throw new Error('Invalid encrypted format');
        }

        const iv = Buffer.from(parts[0], ENCODING);
        const encryptedText = parts[1];
        const key = getKey();

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        let decrypted = decipher.update(encryptedText, ENCODING, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed', error);
        throw new Error('Failed to decrypt data');
    }
};
