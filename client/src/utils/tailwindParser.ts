// Tailwind class categorization utilities

export interface TailwindClass {
    full: string;
    base: string;
    modifier?: string;
    value?: string;
    category: 'layout' | 'typography' | 'colors' | 'spacing' | 'borders' | 'effects' | 'interactivity' | 'sizing' | 'flexbox' | 'grid' | 'other';
    subcategory?: string;
}

// Simplified Tailwind class patterns - only important design variables
const TAILWIND_PATTERNS = {
    colors: [
        /^(text|bg|border|ring|shadow)-((slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950))$/,
        /^(text|bg|border|ring|shadow)-((white|black|transparent|inherit|current))$/,
    ],
    typography: [
        /^(text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl))$/,
        /^(font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black))$/,
        /^(text-(left|center|right|justify|start|end))$/,
    ],
    spacing: [
        /^(p|px|py|pt|pb|pl|pr)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
        /^(m|mx|my|mt|mb|ml|mr)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
    ],
    sizing: [
        /^(w|h|min-w|min-h|max-w|max-h)-((0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|px|full|screen|auto|min|max|fit))$/,
    ],
    borders: [
        /^(border|border-t|border-b|border-l|border-r)-((0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|8)|dashed|dotted|double|none)$/,
        /^(rounded|rounded-t|rounded-b|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br)-((none|sm|md|lg|xl|2xl|3xl|full))$/,
    ],
    effects: [
        /^(shadow|shadow-sm|shadow-md|shadow-lg|shadow-xl|shadow-2xl|shadow-inner|shadow-none)$/,
        /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/,
    ],
    layout: [
        /^(block|inline|inline-block|flex|grid|hidden)$/,
        /^(relative|absolute|fixed|sticky)$/,
        /^(flex-(row|col))$/,
        /^(justify-(start|end|center|between|around))$/,
        /^(items-(start|end|center|stretch))$/,
    ],
    other: []
};

// Color values for display
const COLOR_SWATCHES: Record<string, string> = {
    'slate-50': '#f8fafc',
    'slate-100': '#f1f5f9',
    'slate-200': '#e2e8f0',
    'slate-300': '#cbd5e1',
    'slate-400': '#94a3b8',
    'slate-500': '#64748b',
    'slate-600': '#475569',
    'slate-700': '#334155',
    'slate-800': '#1e293b',
    'slate-900': '#0f172a',
    'slate-950': '#020617',
    'white': '#ffffff',
    'black': '#000000',
    'transparent': 'transparent',
    'red-500': '#ef4444',
    'blue-500': '#3b82f6',
    'green-500': '#10b981',
    'yellow-500': '#eab308',
    'purple-500': '#a855f7',
};

export function categorizeTailwindClass(className: string): TailwindClass['category'] {
    // Remove any state prefixes first
    const cleanClass = className.replace(/^(hover|focus|active|disabled|group-hover|group-focus|sm|md|lg|xl|2xl):/, '');
    
    // Only process important categories, ignore everything else
    for (const [category, patterns] of Object.entries(TAILWIND_PATTERNS)) {
        if (patterns.length > 0) {
            for (const pattern of patterns) {
                if (pattern.test(cleanClass)) {
                    return category as TailwindClass['category'];
                }
            }
        }
    }
    
    // Return null for unimportant classes (won't be displayed)
    return null as any;
}

export function parseTailwindClass(className: string): TailwindClass {
    const parts = className.split(':');
    const modifier = parts.length > 1 ? parts[0] : undefined;
    const fullClass = parts[parts.length - 1];
    
    // Handle complex classes like bg-blue-500/50
    const baseMatch = fullClass.match(/^([a-z-]+)(.*)$/);
    const base = baseMatch ? baseMatch[1] : fullClass;
    const value = baseMatch && baseMatch[2] ? baseMatch[2].slice(1) : undefined;
    
    const category = categorizeTailwindClass(className);
    
    return {
        full: className,
        base,
        modifier,
        value,
        category,
    };
}

export function parseTailwindClasses(html: string): TailwindClass[] {
    const classRegex = /class="([^"]+)"/g;
    const classes: string[] = [];
    let match;
    
    while ((match = classRegex.exec(html)) !== null) {
        const classList = match[1].split(/\s+/);
        classes.push(...classList.filter(cls => cls.trim()));
    }
    
    // Remove duplicates and parse, but only keep important categories
    const uniqueClasses = [...new Set(classes)];
    return uniqueClasses
        .map(parseTailwindClass)
        .filter(cls => cls.category !== null) as TailwindClass[];
}

export function getColorSwatch(colorClass: string): string | null {
    const match = colorClass.match(/(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)-\d+/);
    return match ? COLOR_SWATCHES[match[0]] || null : null;
}

export function updateTailwindClass(html: string, oldClass: string, newClass: string): string {
    return html.replace(new RegExp(`\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), newClass);
}