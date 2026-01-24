import { useState, useEffect } from 'react';
import { Send, Bot, Trash2, Loader2, Monitor, Smartphone, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../lib/api';
import { LLM_PROVIDERS } from '../../../../schema';
import { useAuth } from '@clerk/clerk-react';
import { Combobox } from '../ui/Combobox';

interface Message {
    id: string;
    role: string;
    content: string;
}

interface ChatInterfaceProps {
    onNodeAdd?: (html: string, frameType: 'desktop' | 'mobile') => void;
    onClose?: () => void;
}

export function ChatInterface({ onNodeAdd, onClose }: ChatInterfaceProps) {
    const { projectId, user, updateUserConfig } = useProject();
    const { getToken, isSignedIn } = useAuth();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: 'Hello! I am your OpenStitch assistant. How can I help you design today?' }
    ]);

    // Load history when projectId is available
    useEffect(() => {
        if (!projectId || !isSignedIn) return;

        const loadHistory = async () => {
            const token = await getToken();
            if (!token) return;
            const history = await api.getChatHistory(token, projectId);
            if (history && history.length > 0) {
                setMessages(history);
            }
        };
        loadHistory();
    }, [projectId, isSignedIn, getToken]);

    const [frameType, setFrameType] = useState<'desktop' | 'mobile'>('desktop');
    const [customModelInput, setCustomModelInput] = useState('');

    useEffect(() => {
        if (user?.llmConfig?.activeModel) {
            setCustomModelInput(user.llmConfig.activeModel);
        }
    }, [user?.llmConfig?.activeModel]);

    const handleSend = async () => {
        if (!input.trim() || !projectId || isLoading || !isSignedIn) return;

        const content = input; // Keep original for display
        // Append context for the AI
        const prompt = `${content}\n\n[System Note: The user wants this component for a ${frameType} viewport. Ensure the design is responsive and suitable for ${frameType === 'desktop' ? 'large screens (1024px+)' : 'mobile screens (375px)'}.]`;

        setInput('');
        setIsLoading(true);

        try {
            const token = await getToken();
            if (!token) throw new Error("Not authenticated");

            // Optimistic update
            const tempId = Date.now().toString();
            setMessages(prev => [...prev, { id: tempId, role: 'user', content }]);

            const updatedHistory = await api.sendMessage(token, projectId, prompt);
            setMessages(updatedHistory);

            const lastMessage = updatedHistory[updatedHistory.length - 1];
            if (lastMessage && lastMessage.role === 'assistant' && onNodeAdd) {
                const htmlMatch = lastMessage.content.match(/```html\s*([\s\S]*?)\s*```/);
                if (htmlMatch && htmlMatch[1]) {
                    onNodeAdd(htmlMatch[1], frameType);
                }
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            // TODO: Show error toast
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = async () => {
        if (!projectId || !isSignedIn) return;
        try {
            const token = await getToken();
            if (!token) return;
            await api.clearChatHistory(token, projectId);
            setMessages([]);
        } catch (error) {
            console.error('Failed to clear chat:', error);
        }
    };

    const formatMessageContent = (content: string) => {
        // Remove the fenced code blocks that are used for node generation
        // Specifically replacing the HTML blocks that we extracted
        return content.replace(/```html\s*[\s\S]*?\s*```/g, '*(Code rendered on canvas)*');
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80 shadow-lg">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Bot size={20} className="text-indigo-600" />
                    AI Assistant
                </h2>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClearChat}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-md transition-colors"
                        title="Clear Chat"
                    >
                        <Trash2 size={16} />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Close Chat"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-2">
                <div className="flex gap-2">
                    <select
                        value={user?.llmConfig?.activeProvider || 'openai'}
                        onChange={(e) => {
                            const newProvider = e.target.value;
                            // Default models for providers
                            const defaultModels: Record<string, string> = {
                                openai: 'gpt-4o-mini',
                                anthropic: 'claude-3-opus-20240229',
                                google: 'models/gemini-1.5-pro-latest',
                                openrouter: 'openai/gpt-4o',
                                ollama: 'llama3'
                            };
                            updateUserConfig({
                                activeProvider: newProvider,
                                activeModel: defaultModels[newProvider] || ''
                            });
                        }}
                        className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {LLM_PROVIDERS.map(provider => (
                            <option key={provider} value={provider}>
                                {provider === 'openai' ? 'OpenAI' :
                                    provider === 'openrouter' ? 'OpenRouter' :
                                        provider.charAt(0).toUpperCase() + provider.slice(1)}
                            </option>
                        ))}
                    </select>

                    {(() => {
                        const getModelOptions = (provider: string) => {
                            switch (provider) {
                                case 'openai': return [
                                    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                                    { label: 'GPT-4o', value: 'gpt-4o' },
                                    { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                                    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' }
                                ];
                                case 'anthropic': return [
                                    { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
                                    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
                                    { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' }
                                ];
                                case 'google': return [
                                    { label: 'Gemini 1.5 Pro', value: 'models/gemini-1.5-pro-latest' },
                                    { label: 'Gemini Pro', value: 'models/gemini-pro' }
                                ];
                                case 'ollama': return [
                                    { label: 'Llama 3', value: 'llama3' },
                                    { label: 'Mistral', value: 'mistral' },
                                    { label: 'Code Llama', value: 'codellama' }
                                ];
                                case 'openrouter': return [
                                    { label: 'GPT-4o (OR)', value: 'openai/gpt-4o' },
                                    { label: 'Claude 3 Opus (OR)', value: 'anthropic/claude-3-opus' },
                                    { label: 'Gemini Pro 1.5 (OR)', value: 'google/gemini-pro-1.5' }
                                ];
                                default: return [];
                            }
                        };

                        const activeProvider = user?.llmConfig?.activeProvider || 'openai';

                        return (
                            <Combobox
                                value={customModelInput}
                                onChange={setCustomModelInput}
                                onBlur={() => updateUserConfig({ activeModel: customModelInput })}
                                placeholder="Select or type model..."
                                options={getModelOptions(activeProvider)}
                                className="flex-1"
                            />
                        );
                    })()}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'
                            }`}
                    >
                        <div
                            className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-800'
                                }`}
                        >
                            {formatMessageContent(msg.content)}
                        </div>
                        <span className="text-xs text-slate-400 mt-1 capitalize">
                            {msg.role}
                        </span>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex flex-col items-start fade-in">
                        <div className="bg-slate-100 text-slate-800 max-w-[85%] rounded-lg p-3 text-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-indigo-600" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-200 flex flex-col gap-2">
                <div className="flex gap-2 mb-1">
                    <button
                        onClick={() => setFrameType('desktop')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${frameType === 'desktop'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Monitor size={14} />
                        Desktop
                    </button>
                    <button
                        onClick={() => setFrameType('mobile')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${frameType === 'mobile'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Smartphone size={14} />
                        Mobile
                    </button>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder={isLoading ? "Generating..." : "Describe a component..."}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-slate-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className={`p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
