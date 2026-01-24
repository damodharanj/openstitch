import { memo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Trash2, Code, MousePointerClick, Copy } from 'lucide-react';
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from 'reactflow';
import type { NodeData } from '../../../../schema';

interface ExtendedNodeData extends NodeData {
    onViewCode?: (id: string, code: string) => void;
}

export const StitchNode = memo(({ id, data, selected }: NodeProps<ExtendedNodeData>) => {
    const { getToken } = useAuth();
    const { deleteElements } = useReactFlow();
    const [isInteractive, setIsInteractive] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };
    const { html } = data.component;

    // We can use a srcDoc to inject Tailwind and the content
    const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            body { margin: 0; padding: 0; overflow: ${isInteractive ? 'auto' : 'hidden'}; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

    return (
        <div className={`relative group rounded-lg shadow-lg bg-white border overflow-hidden transition-colors ${selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'}`} style={{ width: '100%', height: '100%', minWidth: 200, minHeight: 100 }}>
            {/* Resizer handles visible when selected */}
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={100}
                handleStyle={{ width: 12, height: 12, borderRadius: 6, opacity: 1 }}
                lineStyle={{ border: '2px solid #3b82f6', opacity: 1 }}
            />

            <div className="w-full h-8 bg-slate-100 border-b border-slate-200 flex items-center px-2 cursor-move handle">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>
                <span className="text-xs text-slate-500 ml-2 font-medium truncate flex-1">
                    {data.label || 'Component'}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        className={`p-1.5 rounded-md transition-colors ${isInteractive
                            ? 'text-blue-600 bg-blue-100 ring-1 ring-blue-200'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                            }`}
                        title={isInteractive ? "Disable Interaction" : "Enable Interaction"}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsInteractive(!isInteractive);
                        }}
                    >
                        <MousePointerClick size={14} />
                    </button>

                    <button
                        className={`p-1.5 rounded-md transition-colors ${isCopying
                            ? 'text-green-600 bg-green-100'
                            : 'text-slate-400 hover:text-purple-500 hover:bg-slate-200'
                            }`}
                        title="Copy as Figma SVG"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                setIsCopying(true);
                                const token = await getToken();
                                if (!token) throw new Error('Unauthenticated');
                                const { api } = await import('../../lib/api');
                                const { svg } = await api.convertToFigmaSvg(token, data.component.html);
                                await navigator.clipboard.writeText(svg);
                                // Optional: You might want to use a toast here if available in the context
                                console.log('Copied SVG to clipboard');
                            } catch (err) {
                                console.error('Failed to copy SVG:', err);
                            } finally {
                                setTimeout(() => setIsCopying(false), 2000);
                            }
                        }}
                    >
                        <Copy size={14} />
                    </button>

                    <button
                        className={`p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-200 rounded-md transition-colors ${selected ? 'text-blue-500 bg-slate-100' : ''}`}
                        title="View Code"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (data.onViewCode) {
                                data.onViewCode(id, html);
                            }
                        }}
                    >
                        <Code size={14} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 rounded-md transition-colors"
                        title="Delete Node"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="w-full h-[calc(100%-2rem)] relative">
                <iframe
                    srcDoc={srcDoc}
                    className={`w-full h-full border-none transition-all duration-200 ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'
                        }`}
                    title="Component Preview"
                />

                {!isInteractive && (
                    <div className="absolute inset-0 bg-transparent" />
                )}

                {/* Visual cue for interactive mode */}
                {isInteractive && (
                    <div className="absolute inset-0 border-2 border-blue-500/50 pointer-events-none animate-pulse opacity-50" style={{ zIndex: 10 }} />
                )}
            </div>

            <Handle type="target" position={Position.Top} className="" />
            <Handle type="source" position={Position.Bottom} className="" />
            <Handle type="target" position={Position.Left} className="" />
            <Handle type="source" position={Position.Right} className="" />
        </div >
    );
});
