import { useState, useEffect } from 'react';
import { Send, Bot, Trash2, Loader2, Monitor, Smartphone, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../lib/api';
import { useAuth } from '@clerk/clerk-react';

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
    const { projectId } = useProject();
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

    const handleSend = async () => {
        if (!input.trim() || !projectId || isLoading || !isSignedIn) return;

        const content = input; // Keep original for display
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
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
