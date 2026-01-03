export const API_BASE = '/api'; // Proxied by Vite
import type { User, Project, ChatHistory } from '../../../schema';

export interface ApiError {
    error: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    // Check for 204 No Content
    if (response.status === 204) {
        return {} as T;
    }
    return response.json();
}

export const api = {

    // Users
    // Syncs the Clerk user to our DB (creates if missing)
    syncUser: async (token: string) => {
        const res = await fetch(`${API_BASE}/users/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
        });
        return handleResponse<User>(res);
    },

    getUser: async (token: string, id: string) => {
        // If getting "me", use /users/me, else /users/:id is fine but needs token
        const res = await fetch(`${API_BASE}/users/${id === 'me' ? 'me' : id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse<User>(res);
    },

    updateUserConfig: async (token: string, config: any) => {
        const res = await fetch(`${API_BASE}/users/me/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(config),
        });
        return handleResponse<{ message: string }>(res);
    },

    // Projects
    createProject: async (token: string, title: string) => {
        const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title }),
        });
        return handleResponse<Project>(res);
    },

    getProjects: async (token: string) => {
        const res = await fetch(`${API_BASE}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse<Project[]>(res);
    },

    getProject: async (token: string, id: string) => {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse<Project>(res);
    },

    updateProject: async (token: string, id: string, updates: Partial<Project>) => {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates),
        });
        return handleResponse<Project>(res);
    },

    // Chat
    getChatHistory: async (token: string, projectId: string) => {
        const res = await fetch(`${API_BASE}/chat/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse<ChatHistory>(res);
    },

    sendMessage: async (token: string, projectId: string, content: string) => {
        const res = await fetch(`${API_BASE}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ projectId, content }),
        });
        return handleResponse<ChatHistory>(res);
    },

    clearChatHistory: async (token: string, projectId: string) => {
        const res = await fetch(`${API_BASE}/chat/${projectId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return handleResponse<void>(res);
    },

    convertToFigmaSvg: async (token: string, html: string) => {
        const res = await fetch(`${API_BASE}/convert/svg`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ html }),
        });
        return handleResponse<{ svg: string }>(res);
    },
};
