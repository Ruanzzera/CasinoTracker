import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { LucideIcon } from 'lucide-react';

interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  icon?: LucideIcon;
  required?: boolean;
  className?: string;
}

export function ComboboxInput({
  value,
  onChange,
  suggestions,
  placeholder,
  icon: Icon,
  required,
  className,
}: ComboboxInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      )}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        className={`${Icon ? 'pl-10' : ''} bg-secondary border-border text-foreground input-glow ${className || ''}`}
        required={required}
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-secondary [&::-webkit-scrollbar-thumb]:bg-primary/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary))_hsl(var(--secondary))]">
          {filtered.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={() => {
                onChange(item);
                setShowSuggestions(false);
              }}
              className="w-full px-3 py-2 text-left text-foreground hover:bg-secondary transition-colors text-sm"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
