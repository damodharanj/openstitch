import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { X, Save, Key } from 'lucide-react';
import { LLM_PROVIDERS, DEFAULT_SYSTEM_PROMPT } from '../../../../schema';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { updateUserConfig } = useProject();
    const [apiKey, setApiKey] = useState('');
    const [provider, setProvider] = useState('openai');
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
    const [isSaving, setIsSaving] = useState(false);

    // In a real app we might fetch user details specifically, 
    // or store user object in context. For now assume we want to set it.

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSaving(true);
        try {
            await updateUserConfig({
                activeProvider: provider as typeof LLM_PROVIDERS[number],
                openai: provider === 'openai' ? { apiKey } : undefined,
                anthropic: provider === 'anthropic' ? { apiKey } : undefined,
                google: provider === 'google' ? { apiKey } : undefined,
                ollama: provider === 'ollama' ? { baseUrl: apiKey } : undefined,
                openrouter: provider === 'openrouter' ? { apiKey } : undefined,
                systemPrompt,
            });
            onClose();
        } catch (err) {
            console.error('Failed to update settings:', err);
            // Handle error UI if needed
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            AI Provider
                        </label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            {LLM_PROVIDERS.map(p => (
                                <option key={p} value={p}>
                                    {p === 'openai' ? 'OpenAI' :
                                        p === 'openrouter' ? 'OpenRouter' :
                                            p.charAt(0).toUpperCase() + p.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <div className="flex items-center gap-2">
                                <Key size={16} />
                                {provider === 'ollama' ? 'Base URL' : 'API Key'}
                            </div>
                        </label>
                        <input
                            type={provider === 'ollama' ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={provider === 'ollama' ? 'http://localhost:11434/api' : 'sk-...'}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            {provider === 'ollama'
                                ? 'Enter the URL where your Ollama instance is running.'
                                : 'Your key is stored securely and used only for your requests.'}
                        </p>
                    </div>

                    <div className="mb-6 border-t border-slate-100 pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-700">
                                System Prompt
                            </label>
                            <button
                                type="button"
                                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Reset to Default
                            </button>
                        </div>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            rows={6}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Customize the instructions given to the AI.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
