import { useState, useMemo } from 'react';
import { ChevronLeft, Settings, Palette, Layout, Sparkles, Eye, List, Copy, Code, Trash2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import type { Node } from 'reactflow';
import { parseTailwindClasses, updateTailwindClass, type TailwindClass } from '../../utils/tailwindParser';
import { TailwindClassRow } from './TailwindClassRow';
import { HighLevelDesign } from './HighLevelDesign';

interface InspectionPanelProps {
    nodes: Node[];
    selectedNodeId: string | null;
    onNodeUpdate?: (nodeId: string, updates: Partial<Node>) => void;
    onViewCode?: (id: string, code: string) => void;
    onDeleteNode?: (nodeId: string) => void;
}

export function InspectionPanel({ nodes, selectedNodeId, onNodeUpdate, onViewCode, onDeleteNode }: InspectionPanelProps) {
    const { getToken } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<'design' | 'layout' | 'tailwind'>('tailwind');
    const [tailwindView, setTailwindView] = useState<'high-level' | 'details'>('high-level');
    const [showOnlyValues, setShowOnlyValues] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['colors', 'typography']));
    const [isCopyingToFigma, setIsCopyingToFigma] = useState(false);
    const [isCopyingHtml, setIsCopyingHtml] = useState(false);
    const [isEditingHtml, setIsEditingHtml] = useState(false);
    const [editedHtml, setEditedHtml] = useState('');
    
    const selectedNode = nodes.find(node => node.id === selectedNodeId);

    const tailwindClasses = useMemo(() => {
        if (!selectedNode) return [];
        return parseTailwindClasses(selectedNode.data.component.html);
    }, [selectedNode]);

    const categorizedClasses = useMemo(() => {
        const grouped: Record<string, TailwindClass[]> = {};
        tailwindClasses.forEach(cls => {
            if (!grouped[cls.category]) {
                grouped[cls.category] = [];
            }
            grouped[cls.category].push(cls);
        });
        return grouped;
    }, [tailwindClasses]);

    const handleClassUpdate = (oldClass: string, newClass: string) => {
        if (!selectedNode || !onNodeUpdate) return;
        
        const newHtml = updateTailwindClass(selectedNode.data.component.html, oldClass, newClass);
        onNodeUpdate(selectedNode.id, {
            data: {
                ...selectedNode.data,
                component: {
                    ...selectedNode.data.component,
                    html: newHtml
                }
            }
        });
    };

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const toggleAllCategories = (expand: boolean) => {
        if (expand) {
            setExpandedCategories(new Set(Object.keys(categorizedClasses)));
        } else {
            setExpandedCategories(new Set());
        }
    };

    const handleCopyToFigma = async () => {
        if (!selectedNode) return;
        
        try {
            setIsCopyingToFigma(true);
            const token = await getToken();
            if (!token) throw new Error('Unauthenticated');
            
            const { api } = await import('../../lib/api');
            const { svg } = await api.convertToFigmaSvg(token, selectedNode.data.component.html);
            await navigator.clipboard.writeText(svg);
            
            // Optional: Show success feedback (you could integrate with a toast system)
            console.log('Copied SVG to clipboard for Figma');
        } catch (err) {
            console.error('Failed to copy SVG to clipboard:', err);
        } finally {
            setTimeout(() => setIsCopyingToFigma(false), 2000);
        }
    };

    const handleCopyHtml = async () => {
        if (!selectedNode) return;
        
        try {
            setIsCopyingHtml(true);
            await navigator.clipboard.writeText(selectedNode.data.component.html);
            console.log('Copied HTML to clipboard');
        } catch (err) {
            console.error('Failed to copy HTML to clipboard:', err);
        } finally {
            setTimeout(() => setIsCopyingHtml(false), 2000);
        }
    };

    const handleEditHtml = () => {
        if (!selectedNode) return;
        setIsEditingHtml(true);
        setEditedHtml(selectedNode.data.component.html);
    };

    const handleSaveHtml = () => {
        if (!selectedNode || !onNodeUpdate) return;
        
        onNodeUpdate(selectedNode.id, {
            data: {
                ...selectedNode.data,
                component: {
                    ...selectedNode.data.component,
                    html: editedHtml
                }
            }
        });
        setIsEditingHtml(false);
    };

    const handleCancelEdit = () => {
        setIsEditingHtml(false);
        setEditedHtml('');
    };

    const getHighLevelDesign = () => {
        const design = {
            primaryColor: '',
            backgroundColor: '',
            fontSize: '',
            fontWeight: '',
            spacing: '',
            borderRadius: '',
            shadow: '',
            opacity: ''
        };

        tailwindClasses.forEach(cls => {
            if (cls.category === 'colors') {
                if (cls.full.startsWith('text-') && !design.primaryColor) {
                    design.primaryColor = cls.full;
                } else if (cls.full.startsWith('bg-') && !design.backgroundColor) {
                    design.backgroundColor = cls.full;
                }
            } else if (cls.category === 'typography') {
                if (cls.full.startsWith('text-') && /\d/.test(cls.full) && !design.fontSize) {
                    design.fontSize = cls.full;
                } else if (cls.full.startsWith('font-') && !design.fontWeight) {
                    design.fontWeight = cls.full;
                }
            } else if (cls.category === 'spacing') {
                if ((cls.full.startsWith('p-') || cls.full.startsWith('px-') || cls.full.startsWith('py-')) && !design.spacing) {
                    design.spacing = cls.full;
                }
            } else if (cls.category === 'borders') {
                if (cls.full.startsWith('rounded') && !design.borderRadius) {
                    design.borderRadius = cls.full;
                }
            } else if (cls.category === 'effects') {
                if (cls.full.startsWith('shadow') && !design.shadow) {
                    design.shadow = cls.full;
                } else if (cls.full.startsWith('opacity-') && !design.opacity) {
                    design.opacity = cls.full;
                }
            }
        });

        return design;
    };

    const hasCustomValue = (cls: TailwindClass): boolean => {
        const defaultValues = {
            colors: ['white', 'transparent', 'inherit', 'current'],
            sizing: ['auto'],
            borders: ['none'],
            typography: ['base', 'normal'],
            effects: ['shadow-none', 'opacity-100'],
            layout: ['block'],
            spacing: []
        };

        const cleanClass = cls.full.replace(/^(hover|focus|active|disabled|group-hover|group-focus|sm|md|lg|xl|2xl):/, '');
        
        // Check if it has a specific value (number, specific color, or non-default)
        if (/\d/.test(cleanClass)) return true;
        if (cls.category === 'colors' && !defaultValues.colors.includes(cls.value || '')) return true;
        if (cls.category === 'sizing' && !defaultValues.sizing.includes(cls.value || '')) return true;
        if (cls.category === 'typography' && !defaultValues.typography.includes(cls.value || '')) return true;
        if (cls.category === 'effects' && !defaultValues.effects.includes(cleanClass)) return true;
        if (cls.category === 'layout' && !defaultValues.layout.includes(cls.base)) return true;
        if (cls.category === 'spacing' && cls.value && cls.value !== '0') return true;
        
        return false;
    };

    if (!selectedNode) {
        return (
            <div className={`bg-white border-l border-slate-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'}`}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className={`font-semibold text-slate-700 ${isCollapsed ? 'hidden' : ''}`}>Inspector</h3>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    >
                        <ChevronLeft size={16} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-center text-slate-400 p-8">
                        <div className="text-center">
                            <Settings size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Select a node to inspect</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const { component } = selectedNode.data;
    const nodeWidth = selectedNode.width || component.width || 400;
    const nodeHeight = selectedNode.height || component.height || 300;

    return (
        <div className={`bg-white border-l border-slate-200 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-80'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className={`font-semibold text-slate-700 ${isCollapsed ? 'hidden' : ''}`}>Inspector</h3>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                    <ChevronLeft size={16} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Node Info with Toolbar */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="font-medium text-slate-700 truncate flex-1">
                                {selectedNode.data.label || 'Component'}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-3">
                            ID: {selectedNode.id}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleCopyHtml}
                                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                                    isCopyingHtml
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <Copy size={14} />
                                {isCopyingHtml ? 'Copied!' : 'Copy HTML'}
                            </button>

                            <button
                                onClick={handleCopyToFigma}
                                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                                    isCopyingToFigma
                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                <Copy size={14} />
                                {isCopyingToFigma ? 'Copied!' : 'Copy SVG'}
                            </button>

                            <button
                                onClick={() => onViewCode?.(selectedNode.id, selectedNode.data.component.html)}
                                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                            >
                                <Code size={14} />
                                View Code
                            </button>

                            <button
                                onClick={() => onDeleteNode?.(selectedNode.id)}
                                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('tailwind')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'tailwind'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Sparkles size={14} />
                            Tailwind
                        </button>
                        <button
                            onClick={() => setActiveTab('design')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'design'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Palette size={14} />
                            Design
                        </button>
                        <button
                            onClick={() => setActiveTab('layout')}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                                activeTab === 'layout'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Layout size={14} />
                            Layout
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'tailwind' && (
                            <div className="flex flex-col h-full">
                                {/* View Toggle */}
                                <div className="flex border-b border-slate-200">
                                    <button
                                        onClick={() => setTailwindView('high-level')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                                            tailwindView === 'high-level'
                                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Eye size={14} />
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setTailwindView('details')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                                            tailwindView === 'details'
                                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <List size={14} />
                                        Details
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {tailwindView === 'high-level' ? (
                                        <HighLevelDesign
                                            design={getHighLevelDesign()}
                                            onClassUpdate={handleClassUpdate}
                                        />
                                    ) : (
                                        <div className="p-4 space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-medium text-slate-700">Design Classes</h4>
                                                <span className="text-xs text-slate-500">
                                                    {showOnlyValues 
                                                        ? `${tailwindClasses.filter(cls => hasCustomValue(cls)).length} custom` 
                                                        : tailwindClasses.length
                                                    } classes
                                                </span>
                                            </div>

                                            {/* Controls */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                                    <input
                                                        type="checkbox"
                                                        id="showOnlyValues"
                                                        checked={showOnlyValues}
                                                        onChange={(e) => setShowOnlyValues(e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <label htmlFor="showOnlyValues" className="text-xs text-slate-600 cursor-pointer select-none">
                                                        Show only classes with values (hide defaults)
                                                    </label>
                                                </div>
                                                
                                                {Object.keys(categorizedClasses).length > 1 && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => toggleAllCategories(true)}
                                                            className="flex-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                                                        >
                                                            Expand All
                                                        </button>
                                                        <button
                                                            onClick={() => toggleAllCategories(false)}
                                                            className="flex-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                                                        >
                                                            Collapse All
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {Object.entries(categorizedClasses).map(([category, classes]) => {
                                                const filteredClasses = showOnlyValues 
                                                    ? classes.filter(cls => hasCustomValue(cls))
                                                    : classes;
                                                
                                                if (filteredClasses.length === 0) return null;
                                                
                                                const isExpanded = expandedCategories.has(category);
                                                
                                                return (
                                                    <div key={category} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                                        <button
                                                            onClick={() => toggleCategory(category)}
                                                            className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ChevronLeft 
                                                                    size={12} 
                                                                    className={`text-slate-400 transition-transform ${
                                                                        isExpanded ? 'rotate-90' : ''
                                                                    }`} 
                                                                />
                                                                <div 
                                                                    className={`w-2 h-2 rounded-full transition-colors ${
                                                                        category === 'colors' ? 'bg-red-400' :
                                                                        category === 'typography' ? 'bg-blue-400' :
                                                                        category === 'spacing' ? 'bg-green-400' :
                                                                        category === 'sizing' ? 'bg-purple-400' :
                                                                        category === 'borders' ? 'bg-yellow-400' :
                                                                        category === 'effects' ? 'bg-pink-400' :
                                                                        'bg-slate-400'
                                                                    }`} 
                                                                />
                                                                <span className="text-xs font-medium text-slate-700">
                                                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                                                </span>
                                                                <span className="text-xs text-slate-400 group-hover:text-slate-500">
                                                                    ({filteredClasses.length})
                                                                </span>
                                                            </div>
                                                            <span className={`text-xs text-slate-400 transition-transform ${
                                                                isExpanded ? 'rotate-180' : ''
                                                            }`}>
                                                                {filteredClasses.length > 0 ? '▼' : ''}
                                                            </span>
                                                        </button>
                                                        
                                                        <div className={`transition-all duration-200 ease-in-out ${
                                                            isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-0 overflow-hidden'
                                                        }`}>
                                                            <div className="p-2 pt-0 space-y-1 bg-slate-50/30">
                                                                {filteredClasses.map((cls, idx) => (
                                                                    <TailwindClassRow
                                                                        key={idx}
                                                                        class={cls}
                                                                        onUpdate={handleClassUpdate}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {tailwindClasses.length === 0 && (
                                                <div className="text-center text-slate-400 py-8">
                                                    <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No Tailwind classes found</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'design' && (
                            <div className="p-4 space-y-4">


                                {/* Label */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Label
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.label || ''}
                                        onChange={(e) => onNodeUpdate?.(selectedNode.id, {
                                            data: {
                                                ...selectedNode.data,
                                                label: e.target.value
                                            }
                                        })}
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Component label"
                                    />
                                </div>

                                {/* HTML Content */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-slate-700">
                                            HTML Content
                                        </label>
                                        <button
                                            onClick={isEditingHtml ? handleSaveHtml : handleEditHtml}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                isEditingHtml
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                                            }`}
                                        >
                                            {isEditingHtml ? 'Save Changes' : 'Edit HTML'}
                                        </button>
                                    </div>
                                    
                                    {isEditingHtml ? (
                                        <div className="border border-slate-200 rounded-md overflow-hidden">
                                            <textarea
                                                value={editedHtml}
                                                onChange={(e) => setEditedHtml(e.target.value)}
                                                className="w-full px-3 py-2 text-xs font-mono bg-white border-none resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-48"
                                                placeholder="Edit HTML content..."
                                            />
                                            <div className="flex items-center justify-between p-3 bg-slate-50 border-t border-slate-200">
                                                <span className="text-xs text-slate-500">
                                                    {editedHtml.length} characters
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveHtml}
                                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                                            <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                                                {component.html}
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="bg-slate-50 rounded-md p-3">
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">Quick Stats</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">HTML Length:</span>
                                            <span className="text-slate-700">{component.html.length} chars</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Line Count:</span>
                                            <span className="text-slate-700">{component.html.split('\n').length} lines</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'layout' && (
                            <div className="p-4 space-y-4">
                                {/* Position */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Position
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">X</label>
                                            <input
                                                type="number"
                                                value={Math.round(selectedNode.position.x)}
                                                onChange={(e) => onNodeUpdate?.(selectedNode.id, {
                                                    position: {
                                                        ...selectedNode.position,
                                                        x: parseInt(e.target.value) || 0
                                                    }
                                                })}
                                                className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Y</label>
                                            <input
                                                type="number"
                                                value={Math.round(selectedNode.position.y)}
                                                onChange={(e) => onNodeUpdate?.(selectedNode.id, {
                                                    position: {
                                                        ...selectedNode.position,
                                                        y: parseInt(e.target.value) || 0
                                                    }
                                                })}
                                                className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Size */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Size
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Width</label>
                                            <input
                                                type="number"
                                                value={nodeWidth}
                                                onChange={(e) => {
                                                    const newWidth = parseInt(e.target.value) || 200;
                                                    onNodeUpdate?.(selectedNode.id, {
                                                        width: newWidth,
                                                        style: {
                                                            ...selectedNode.style,
                                                            width: newWidth
                                                        }
                                                    });
                                                }}
                                                className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Height</label>
                                            <input
                                                type="number"
                                                value={nodeHeight}
                                                onChange={(e) => {
                                                    const newHeight = parseInt(e.target.value) || 100;
                                                    onNodeUpdate?.(selectedNode.id, {
                                                        height: newHeight,
                                                        style: {
                                                            ...selectedNode.style,
                                                            height: newHeight
                                                        }
                                                    });
                                                }}
                                                className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Component Dimensions (if set) */}
                                {(component.width || component.height) && (
                                    <div className="bg-blue-50 rounded-md p-3">
                                        <h4 className="text-sm font-medium text-blue-700 mb-2">Component Dimensions</h4>
                                        <div className="space-y-1 text-xs">
                                            {component.width && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-600">Content Width:</span>
                                                    <span className="text-blue-800">{component.width}px</span>
                                                </div>
                                            )}
                                            {component.height && (
                                                <div className="flex justify-between">
                                                    <span className="text-blue-600">Content Height:</span>
                                                    <span className="text-blue-800">{component.height}px</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}