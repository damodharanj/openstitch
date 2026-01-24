import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { getColorSwatch } from '../../utils/tailwindParser';
import type { TailwindClass } from '../../utils/tailwindParser';

interface TailwindClassRowProps {
    class: TailwindClass;
    onUpdate: (oldClass: string, newClass: string) => void;
}

export function TailwindClassRow({ class: cls, onUpdate }: TailwindClassRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(cls.full);

    const handleSave = () => {
        if (editValue.trim() && editValue !== cls.full) {
            onUpdate(cls.full, editValue.trim());
        }
        setIsEditing(false);
        setEditValue(cls.full);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditValue(cls.full);
    };

    const colorSwatch = getColorSwatch(cls.full);

    return (
        <div className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 group transition-colors">
            {colorSwatch && (
                <div
                    className="w-3 h-3 rounded-sm border border-slate-200 flex-shrink-0"
                    style={{ backgroundColor: colorSwatch }}
                />
            )}
            
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className="w-full px-1.5 py-0.5 text-xs font-mono border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                    />
                ) : (
                    <span className="text-xs font-mono text-slate-600 truncate block">
                        {cls.full}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleSave}
                            className="p-0.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                            <Check size={10} />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-0.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                            <X size={10} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                        <Edit2 size={10} />
                    </button>
                )}
            </div>
        </div>
    );
}