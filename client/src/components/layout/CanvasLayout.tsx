import { Sidebar } from './Sidebar';
import { useAuth } from '@clerk/clerk-react';
import { ChatInterface } from './ChatInterface';
import { InfiniteCanvas } from '../canvas/InfiniteCanvas';
import { CodeViewModal } from '../modals/CodeViewModal';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../lib/api';
import { useCallback, useEffect, useState } from 'react';
import {
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
    type Node,
    type Viewport,
} from 'reactflow';

// Helper to clean node data before saving
const cleanNode = (node: Node) => {
    let width = node.width;
    let height = node.height;

    // ReactFlow NodeResizer updates style.width/height
    if (node.style?.width) {
        const w = parseInt(String(node.style.width), 10);
        if (!isNaN(w)) width = w;
    }
    if (node.style?.height) {
        const h = parseInt(String(node.style.height), 10);
        if (!isNaN(h)) height = h;
    }

    return {
        ...node,
        width: width ?? undefined,
        height: height ?? undefined,
        selected: undefined,
        positionAbsolute: undefined,
        dragging: undefined,
        data: {
            ...node.data,
            onViewCode: undefined
        }
    };
};

export function CanvasLayout() {
    const { projectId } = useProject();
    const { getToken, isSignedIn } = useAuth();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [isLoaded, setIsLoaded] = useState(false);
    const [isCodeViewOpen, setIsCodeViewOpen] = useState(false);
    const [viewCodeContent, setViewCodeContent] = useState<string>('');
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const [initialViewport, setInitialViewport] = useState<{ x: number; y: number; zoom: number } | undefined>(undefined);

    // Auto-save nodes
    useEffect(() => {
        if (!isLoaded || !projectId || !isSignedIn) return;

        const timer = setTimeout(async () => {
            try {
                const token = await getToken();
                if (!token) return;
                await api.updateProject(token, projectId, {
                    nodes: nodes.map(cleanNode),
                    viewport,
                });
            } catch (err) {
                console.error('Failed to auto-save project:', err);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [nodes, viewport, projectId, isLoaded, isSignedIn, getToken]);

    const onMoveEnd = useCallback((_event: any, newViewport: Viewport) => {
        setViewport(newViewport);
    }, []);

    const handleViewCode = useCallback((id: string, code: string) => {
        setEditingNodeId(id);
        setViewCodeContent(code);
        setIsCodeViewOpen(true);
    }, []);

    const handleSaveCode = useCallback(async (newCode: string) => {
        if (!editingNodeId || !projectId) return;

        // Optimistic update
        const updatedNodes = nodes.map(node => {
            if (node.id === editingNodeId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        component: {
                            ...node.data.component,
                            html: newCode
                        }
                    }
                };
            }
            return node;
        });
        setNodes(updatedNodes);

        // API Save - immediate save for code changes
        try {
            const token = await getToken();
            if (!token) return;
            await api.updateProject(token, projectId, {
                nodes: updatedNodes.map(cleanNode),
            });
        } catch (err) {
            console.error('Failed to save code updates:', err);
        }
    }, [editingNodeId, projectId, nodes, setNodes, getToken]);

    // Load project data
    useEffect(() => {
        if (!projectId || !isSignedIn) {
            setIsLoaded(false);
            return;
        }

        const load = async () => {
            const token = await getToken();
            if (!token) return;
            try {
                const project = await api.getProject(token, projectId);
                if (project) {
                    const mappedNodes = project.nodes.map((n) => ({
                        ...n,
                        type: n.type || 'stitch',
                        style: {
                            width: n.width,
                            height: n.height,
                        },
                        data: {
                            ...n.data,
                            onViewCode: handleViewCode
                        }
                    }));
                    setNodes(mappedNodes);
                    setEdges(project.edges);
                    if (project.viewport) {
                        setViewport(project.viewport);
                        setInitialViewport(project.viewport);
                    }
                    setIsLoaded(true);
                }
            } catch (err) {
                console.error("Failed to load project:", err);
            }
        };
        load();
    }, [projectId, isSignedIn, getToken, setNodes, setEdges, handleViewCode]);

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const handleAddNode = useCallback(async (html: string, frameType: 'desktop' | 'mobile' = 'desktop') => {
        if (!projectId) return;

        const width = frameType === 'mobile' ? 375 : 1024;
        const height = frameType === 'mobile' ? 667 : 768;

        const findNonOverlappingPosition = (nodes: Node[], w: number, h: number) => {
            let x = 100;
            let y = 100;
            let collision = true;
            let retries = 0;

            while (collision && retries < 100) {
                collision = false;
                for (const node of nodes) {
                    const nodeW = node.width || node.data?.component?.width || 400;
                    const nodeH = node.height || node.data?.component?.height || 300;

                    // Simple AABB collision detection
                    if (
                        x < node.position.x + nodeW + 50 &&
                        x + w + 50 > node.position.x &&
                        y < node.position.y + nodeH + 50 &&
                        y + h + 50 > node.position.y
                    ) {
                        collision = true;
                        // Move diagonally
                        x += 50;
                        y += 50;
                        break;
                    }
                }
                retries++;
            }
            return { x, y };
        };

        const position = findNonOverlappingPosition(nodes, width, height);

        const newNode: Node = {
            id: crypto.randomUUID(),
            type: 'stitch',
            position,
            width,  // Set explicit width on node
            height, // Set explicit height on node
            style: { width, height }, // Set style for ReactFlow
            data: {
                label: 'New Component',
                component: {
                    html,
                    width,
                    height,
                },
                onViewCode: handleViewCode,
            },
        };

        const updatedNodes = [...nodes, newNode];
        setNodes(updatedNodes);

        // Auto-save effect will pick this up
    }, [projectId, nodes, setNodes, handleViewCode]);

    // State for Chat Visibility
    const [isChatOpen, setIsChatOpen] = useState(true);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
            <Sidebar isChatOpen={isChatOpen} onToggleChat={() => setIsChatOpen(!isChatOpen)} />

            <div className={`${isChatOpen ? 'block' : 'hidden'} h-full border-r border-slate-200 shadow-xl z-10 transition-all duration-300`}>
                <ChatInterface
                    onNodeAdd={handleAddNode}
                    onClose={() => setIsChatOpen(false)}
                />
            </div>

            <div className="flex-1 h-full relative">
                {isLoaded && (
                    <InfiniteCanvas
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onMoveEnd={onMoveEnd}
                        defaultViewport={initialViewport}
                    />
                )}
            </div>

            <CodeViewModal
                isOpen={isCodeViewOpen}
                onClose={() => setIsCodeViewOpen(false)}
                code={viewCodeContent}
                onSave={handleSaveCode}
            />
        </div>
    );
}
