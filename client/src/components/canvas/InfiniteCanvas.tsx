import { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    type NodeTypes,
    type Node as ReactFlowNode,
    type Edge as ReactFlowEdge,
    type OnMoveEnd,
    type Viewport,
    type OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { StitchNode } from './StitchNode';

interface InfiniteCanvasProps {
    nodes: ReactFlowNode[];
    edges: ReactFlowEdge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onMoveEnd?: OnMoveEnd;
    onSelectionChange?: (params: OnSelectionChangeParams) => void;
    defaultViewport?: Viewport;
}

export function InfiniteCanvas({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onMoveEnd,
    onSelectionChange,
    defaultViewport,
}: InfiniteCanvasProps) {
    const nodeTypes = useMemo<NodeTypes>(() => ({ stitch: StitchNode }), []);

    return (
        <div className="w-full h-full bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                fitView={!defaultViewport}
                onMoveEnd={onMoveEnd}
                defaultViewport={defaultViewport}
                minZoom={0.1}
                maxZoom={4}
            >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}
