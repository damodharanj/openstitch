import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface ComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
    className?: string;
    onBlur?: () => void;
}

export function Combobox({ value, onChange, options, placeholder, className, onBlur }: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [containerRef]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1 pr-8 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                    className="absolute right-0 top-0 bottom-0 px-2 text-slate-400 hover:text-slate-600"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <ChevronDown size={14} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <button
                                key={option.value}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-100 flex items-center justify-between ${value === option.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                                    }`}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check size={12} />}
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-slate-400">No options found</div>
                    )}
                </div>
            )}
        </div>
    );
}
