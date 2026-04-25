import { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { X, Save, Key, Globe, Cpu } from 'lucide-react';
import { DEFAULT_SYSTEM_PROMPT } from '../../../../schema';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { updateUserConfig, user } = useProject();
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [activeModel, setActiveModel] = useState('');
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state from user config when modal opens
    useEffect(() => {
        if (isOpen && user?.llmConfig) {
            setApiKey(user.llmConfig.apiKey || '');
            setBaseUrl(user.llmConfig.baseUrl || '');
            setActiveModel(user.llmConfig.activeModel || '');
            setSystemPrompt(user.llmConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT);
        }
    }, [isOpen, user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSaving(true);
        try {
            await updateUserConfig({
                activeProvider: 'openai-compatible',
                apiKey,
                baseUrl,
                activeModel,
                systemPrompt,
            });
            onClose();
        } catch (err) {
            console.error('Failed to update settings:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">LLM Configuration</h2>
                        <p className="text-xs text-slate-500">Provide an OpenAI-compatible API endpoint</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Globe size={16} />
                                    Base URL
                                </div>
                            </label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder="https://api.openai.com/v1"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Key size={16} />
                                    API Key
                                </div>
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Cpu size={16} />
                                    Model ID
                                </div>
                            </label>
                            <input
                                type="text"
                                value={activeModel}
                                onChange={(e) => setActiveModel(e.target.value)}
                                placeholder="gpt-4o"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-100 pt-6">
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
                            rows={4}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                        />
                    </div>

                    <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
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

