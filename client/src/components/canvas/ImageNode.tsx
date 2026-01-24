import { memo, useState, useRef } from 'react';
import { Trash2, Image, Upload, Copy } from 'lucide-react';
import { Handle, Position, NodeResizer, type NodeProps, useReactFlow } from 'reactflow';

interface ExtendedNodeData {
    type: 'image';
    image: {
        src: string;
        alt?: string;
        width?: number;
        height?: number;
    };
    label?: string;
}

export const ImageNode = memo(({ id, data, selected }: NodeProps<ExtendedNodeData>) => {
    const { deleteElements } = useReactFlow();
    const [isCopying, setIsCopying] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newSrc = event.target?.result as string;
                // TODO: Update node data with new image src
                console.log('New image src:', newSrc);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCopyImage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setIsCopying(true);
            // Create a canvas element to copy the image
            const img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            await navigator.clipboard.write([
                                new ClipboardItem({ 'image/png': blob })
                            ]);
                            console.log('Image copied to clipboard');
                        }
                    });
                }
            };
            img.src = data.image.src;
        } catch (error) {
            console.error('Failed to copy image:', error);
        } finally {
            setTimeout(() => setIsCopying(false), 2000);
        }
    };

    const handleUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    return (
        <div className={`relative group rounded-lg shadow-lg bg-white border overflow-hidden transition-colors ${selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'}`} style={{ width: '100%', height: '100%', minWidth: 200, minHeight: 150 }}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Resizer handles visible when selected */}
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={150}
                handleStyle={{ width: 12, height: 12, borderRadius: 6, opacity: 1 }}
                lineStyle={{ border: '2px solid #3b82f6', opacity: 1 }}
            />

            <div className="w-full h-8 bg-slate-100 border-b border-slate-200 flex items-center px-2 cursor-move handle">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🖼️</span>
                    <span className="text-xs text-slate-500 font-medium truncate flex-1">
                        {data.label || 'Image'}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        className={`p-1.5 rounded-md transition-colors ${isCopying
                            ? 'text-green-600 bg-green-100'
                            : 'text-slate-400 hover:text-purple-500 hover:bg-slate-200'
                            }`}
                        title="Copy Image"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={handleCopyImage}
                    >
                        <Copy size={14} />
                    </button>

                    <button
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-200 rounded-md transition-colors"
                        title="Upload Image"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={handleUploadClick}
                    >
                        <Upload size={14} />
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

            <div className="w-full h-[calc(100%-2rem)] relative overflow-hidden bg-slate-50">
                {data.image.src ? (
                    <img
                        src={data.image.src}
                        alt={data.image.alt || 'Node image'}
                        className="w-full h-full object-contain"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Image size={32} className="mb-2" />
                        <span className="text-xs">No image</span>
                        <button
                            className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            onClick={handleUploadClick}
                        >
                            Upload Image
                        </button>
                    </div>
                )}
            </div>

            <Handle type="target" position={Position.Top} className="" />
            <Handle type="source" position={Position.Bottom} className="" />
            <Handle type="target" position={Position.Left} className="" />
            <Handle type="source" position={Position.Right} className="" />
        </div>
    );
});