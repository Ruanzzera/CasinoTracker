import { useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  /** Currently selected values. Empty array = "Todos" (no filter applied). */
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  className?: string;
}

/** Checkbox multi-select. "Todos" toggles all options. Empty selection is
 *  treated by callers as "no filter" (equivalent to all). */
export function MultiSelectFilter({
  options, selected, onChange,
  placeholder = 'Selecionar...', allLabel = 'Todos', className,
}: Props) {
  const allSelected = selected.length === 0 || selected.length === options.length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleAll = () => {
    if (allSelected) onChange(options.map(o => o.value));
    else onChange([]);
  };

  const toggle = (value: string) => {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value); else next.add(value);
    // Normalize: if user selected all → treat as empty ("Todos") for cleaner state.
    if (next.size === options.length) onChange([]);
    else onChange(Array.from(next));
  };

  const triggerLabel = allSelected
    ? allLabel
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? placeholder
      : `${selected.length} selecionados`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-between bg-secondary border-border text-foreground font-normal',
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0 bg-popover border-border">
        <div className="max-h-72 overflow-y-auto py-1">
          <button
            type="button"
            onClick={toggleAll}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary text-foreground border-b border-border"
          >
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} onClick={(e) => e.stopPropagation()} />
            <span className="font-medium">{allLabel}</span>
            {allSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
          </button>
          {options.map((opt) => {
            const isChecked = allSelected || selectedSet.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary text-foreground"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggle(opt.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Nenhuma opção</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}