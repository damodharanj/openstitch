import { memo, useState } from 'react';
import { Trash2, Database, RefreshCw, Copy } from 'lucide-react';
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from 'reactflow';

interface ExtendedNodeData {
    type: 'data_source';
    dataSource: {
        type: string;
        config: {
            url?: string;
            queryId?: string;
            environmentId?: string;
            apiKey?: string;
            query?: string;
        };
        data?: Record<string, unknown>;
    };
    label?: string;
}

export const DataSourceNode = memo(({ id, data, selected }: NodeProps<ExtendedNodeData>) => {
    const { deleteElements } = useReactFlow();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    const handleRefresh = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRefreshing(true);
        try {
            // TODO: Implement data refresh logic based on source type
            console.log('Refreshing data for', data.dataSource.type);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleCopyData = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setIsCopying(true);
            const dataToCopy = JSON.stringify(data.dataSource.data || {}, null, 2);
            await navigator.clipboard.writeText(dataToCopy);
            console.log('Data copied to clipboard');
        } catch (error) {
            console.error('Failed to copy data:', error);
        } finally {
            setTimeout(() => setIsCopying(false), 2000);
        }
    };

    const getSourceIcon = () => {
        switch (data.dataSource.type) {
            case 'querybook':
                return '📊';
            case 'api':
                return '🔌';
            default:
                return '🗄️';
        }
    };

    return (
        <div className={`relative group rounded-lg shadow-lg bg-white border overflow-hidden transition-colors ${selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'}`} style={{ width: '100%', height: '100%', minWidth: 250, minHeight: 150 }}>
            {/* Resizer handles visible when selected */}
            <NodeResizer
                isVisible={selected}
                minWidth={250}
                minHeight={150}
                handleStyle={{ width: 12, height: 12, borderRadius: 6, opacity: 1 }}
                lineStyle={{ border: '2px solid #3b82f6', opacity: 1 }}
            />

            <div className="w-full h-8 bg-slate-100 border-b border-slate-200 flex items-center px-2 cursor-move handle">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{getSourceIcon()}</span>
                    <span className="text-xs text-slate-500 font-medium truncate flex-1">
                        {data.label || `${data.dataSource.type} Data Source`}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        className={`p-1.5 rounded-md transition-colors ${isRefreshing
                            ? 'text-blue-600 bg-blue-100 animate-spin'
                            : 'text-slate-400 hover:text-blue-500 hover:bg-slate-200'
                            }`}
                        title="Refresh Data"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={14} />
                    </button>

                    <button
                        className={`p-1.5 rounded-md transition-colors ${isCopying
                            ? 'text-green-600 bg-green-100'
                            : 'text-slate-400 hover:text-purple-500 hover:bg-slate-200'
                            }`}
                        title="Copy Data"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={handleCopyData}
                    >
                        <Copy size={14} />
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

            <div className="w-full h-[calc(100%-2rem)] p-3 overflow-auto">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Database size={12} />
                        <span className="font-medium uppercase">{data.dataSource.type}</span>
                    </div>
                    
                    {data.dataSource.config.url && (
                        <div className="text-xs text-slate-500">
                            <div className="font-medium">URL:</div>
                            <div className="truncate">{data.dataSource.config.url as string}</div>
                        </div>
                    )}
                    
                    {data.dataSource.config.queryId && (
                        <div className="text-xs text-slate-500">
                            <div className="font-medium">Query ID:</div>
                            <div className="truncate">{data.dataSource.config.queryId as string}</div>
                        </div>
                    )}

                    {data.dataSource.data && (
                        <div className="mt-3">
                            <div className="text-xs text-slate-500 font-medium mb-1">Preview:</div>
                            <pre className="text-xs bg-slate-50 p-2 rounded border border-slate-200 max-h-32 overflow-auto">
                                {JSON.stringify(data.dataSource.data, null, 2).substring(0, 200)}
                                {JSON.stringify(data.dataSource.data, null, 2).length > 200 && '...'}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            <Handle type="target" position={Position.Top} className="" />
            <Handle type="source" position={Position.Bottom} className="" />
            <Handle type="target" position={Position.Left} className="" />
            <Handle type="source" position={Position.Right} className="" />
        </div>
    );
});