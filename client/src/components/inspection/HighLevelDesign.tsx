import { useState } from 'react';
import { getColorSwatch } from '../../utils/tailwindParser';

interface HighLevelDesignProps {
    design: {
        primaryColor: string;
        backgroundColor: string;
        fontSize: string;
        fontWeight: string;
        spacing: string;
        borderRadius: string;
        shadow: string;
        opacity: string;
    };
    onClassUpdate: (oldClass: string, newClass: string) => void;
}

interface DesignTokenProps {
    label: string;
    value: string;
    type: 'color' | 'text' | 'size';
    onUpdate: (newClass: string) => void;
}

function DesignToken({ label, value, type, onUpdate }: DesignTokenProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    if (!value) return null;

    const handleSave = () => {
        if (editValue.trim() && editValue !== value) {
            onUpdate(editValue.trim());
        }
        setIsEditing(false);
        setEditValue(value);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValue(value);
    };

    const colorSwatch = type === 'color' ? getColorSwatch(value) : null;

    return (
        <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {colorSwatch && (
                    <div
                        className="w-4 h-4 rounded border border-slate-200 flex-shrink-0"
                        style={{ backgroundColor: colorSwatch }}
                    />
                )}
                <span className="text-xs text-slate-600 min-w-0">{label}:</span>
            </div>
            
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                {isEditing ? (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className="w-full px-2 py-0.5 text-xs font-mono border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                    />
                ) : (
                    <span className="text-xs font-mono text-slate-700 truncate">{value}</span>
                )}
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="p-0.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                                ✓
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-0.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                ✕
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        >
                            ✏️
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function HighLevelDesign({ design, onClassUpdate }: HighLevelDesignProps) {
    const handleUpdate = (oldValue: string, newValue: string) => {
        if (oldValue) {
            onClassUpdate(oldValue, newValue);
        }
    };

    return (
        <div className="p-4 space-y-3">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Design Overview</h4>
            
            <div className="space-y-1">
                {design.backgroundColor && (
                    <DesignToken
                        label="Background"
                        value={design.backgroundColor}
                        type="color"
                        onUpdate={(newValue) => handleUpdate(design.backgroundColor, newValue)}
                    />
                )}
                
                {design.primaryColor && (
                    <DesignToken
                        label="Text Color"
                        value={design.primaryColor}
                        type="color"
                        onUpdate={(newValue) => handleUpdate(design.primaryColor, newValue)}
                    />
                )}
                
                {design.fontSize && (
                    <DesignToken
                        label="Font Size"
                        value={design.fontSize}
                        type="size"
                        onUpdate={(newValue) => handleUpdate(design.fontSize, newValue)}
                    />
                )}
                
                {design.fontWeight && (
                    <DesignToken
                        label="Font Weight"
                        value={design.fontWeight}
                        type="text"
                        onUpdate={(newValue) => handleUpdate(design.fontWeight, newValue)}
                    />
                )}
                
                {design.spacing && (
                    <DesignToken
                        label="Padding"
                        value={design.spacing}
                        type="size"
                        onUpdate={(newValue) => handleUpdate(design.spacing, newValue)}
                    />
                )}
                
                {design.borderRadius && (
                    <DesignToken
                        label="Border Radius"
                        value={design.borderRadius}
                        type="text"
                        onUpdate={(newValue) => handleUpdate(design.borderRadius, newValue)}
                    />
                )}
                
                {design.shadow && (
                    <DesignToken
                        label="Shadow"
                        value={design.shadow}
                        type="text"
                        onUpdate={(newValue) => handleUpdate(design.shadow, newValue)}
                    />
                )}
                
                {design.opacity && (
                    <DesignToken
                        label="Opacity"
                        value={design.opacity}
                        type="text"
                        onUpdate={(newValue) => handleUpdate(design.opacity, newValue)}
                    />
                )}
            </div>

            {/* Show when no design tokens found */}
            {!Object.values(design).filter(Boolean).length && (
                <div className="text-center text-slate-400 py-8">
                    <p className="text-sm">No design tokens found</p>
                    <p className="text-xs mt-1">Add some Tailwind classes to see them here</p>
                </div>
            )}
        </div>
    );
}