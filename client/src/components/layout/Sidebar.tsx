import { Layers, Layout, Settings, FolderOpen, MessageSquare, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SettingsModal } from '../settings/SettingsModal';
import { AddNodeModal } from '../modals/AddNodeModal';
import { UserButton } from '@clerk/clerk-react';
import type { Node } from 'reactflow';

interface SidebarProps {
    isChatOpen?: boolean;
    onToggleChat?: () => void;
    onAddNode?: (node: Node) => void;
}

export function Sidebar({ isChatOpen, onToggleChat, onAddNode }: SidebarProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);

    const handleAddDataSource = (config: any) => {
        if (!onAddNode) return;
        
        const newNode: Node = {
            id: crypto.randomUUID(),
            type: 'data_source',
            position: { x: 100, y: 100 },
            data: {
                type: 'data_source',
                dataSource: config,
                label: `${config.type} Data Source`
            }
        };
        
        onAddNode(newNode);
    };

    const handleAddImage = async (file: File) => {
        if (!onAddNode) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const src = event.target?.result as string;
            const newNode: Node = {
                id: crypto.randomUUID(),
                type: 'image',
                position: { x: 100, y: 100 },
                data: {
                    type: 'image',
                    image: {
                        src,
                        alt: file.name
                    },
                    label: file.name.split('.')[0]
                }
            };
            onAddNode(newNode);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="w-16 h-full bg-slate-900 flex flex-col items-center py-4 gap-6 text-slate-400">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold mb-4">
                OS
            </div>

            <Link
                to="/"
                className="p-2 hover:bg-slate-800 rounded-lg hover:text-white transition-colors block"
                title="Projects"
            >
                <FolderOpen size={24} />
            </Link>

            <button className="p-2 hover:bg-slate-800 rounded-lg hover:text-white transition-colors" title="Layers">
                <Layers size={24} />
            </button>

            <button 
                onClick={() => setIsAddNodeOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-lg hover:text-white transition-colors" 
                title="Add Node"
            >
                <Plus size={24} />
            </button>

            <button className="p-2 hover:bg-slate-800 rounded-lg hover:text-white transition-colors" title="Components">
                <Layout size={24} />
            </button>

            {onToggleChat && (
                <button
                    onClick={onToggleChat}
                    className={`p-2 hover:bg-slate-800 rounded-lg transition-colors ${isChatOpen ? 'text-indigo-400 bg-slate-800' : 'hover:text-white'}`}
                    title={isChatOpen ? "Close Chat" : "Open Chat"}
                >
                    <MessageSquare size={24} />
                </button>
            )}

            <div className="mt-auto flex flex-col gap-4 items-center">
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-8 h-8" } }} />

                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 hover:bg-slate-800 rounded-lg hover:text-white transition-colors"
                    title="Settings"
                >
                    <Settings size={24} />
                </button>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <AddNodeModal
                isOpen={isAddNodeOpen}
                onClose={() => setIsAddNodeOpen(false)}
                onAddDataSource={handleAddDataSource}
                onAddImage={handleAddImage}
            />
        </div>
    );
}
