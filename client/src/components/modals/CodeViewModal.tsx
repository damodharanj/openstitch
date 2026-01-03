import { X, Copy, Check, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CodeViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    onSave: (newCode: string) => void;
}

export function CodeViewModal({ isOpen, onClose, code, onSave }: CodeViewModalProps) {
    const [currentCode, setCurrentCode] = useState(code);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setCurrentCode(code);
    }, [code]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(currentCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        onSave(currentCode);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        Edit Component Code
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                        <div className="h-6 w-px bg-slate-300 mx-1" />
                        <button
                            onClick={handleCopy}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
                            title="Copy Code"
                        >
                            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative bg-slate-900">
                    <textarea
                        value={currentCode}
                        onChange={(e) => setCurrentCode(e.target.value)}
                        className="w-full h-full p-4 bg-slate-900 text-slate-200 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                        spellCheck={false}
                    />
                </div>
                <div className="px-4 py-2 bg-slate-100 text-xs text-slate-500 border-t border-slate-200 flex justify-between">
                    <span>HTML / Tailwind CSS</span>
                    <span>Press Save to update canvas</span>
                </div>
            </div>
        </div>
    );
}
