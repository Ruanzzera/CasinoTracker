import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCustomEntryTypes } from '@/hooks/useCustomEntryTypes';
import { toast } from 'sonner';

interface TypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function TypeSelect({ value, onValueChange, className }: TypeSelectProps) {
  const { allTypes, addCustomType, removeCustomType } = useCustomEntryTypes();
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');

  const handleAddType = () => {
    const trimmed = newTypeLabel.trim();
    if (!trimmed) {
      toast.error('Digite um nome para o tipo');
      return;
    }
    const exists = allTypes.some(
      t => t.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.error('Esse tipo já existe');
      return;
    }
    const newValue = addCustomType(trimmed);
    onValueChange(newValue);
    setNewTypeLabel('');
    setShowNewType(false);
    toast.success(`Tipo "${trimmed}" criado!`);
  };

  const handleRemove = (e: React.MouseEvent, typeValue: string) => {
    e.stopPropagation();
    removeCustomType(typeValue);
    if (value === typeValue) {
      onValueChange('bonus');
    }
    toast.success('Tipo removido');
  };

  const currentLabel = allTypes.find(t => t.value === value)?.label ?? value;

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === '__add_new__') {
            setShowNewType(true);
          } else {
            onValueChange(v);
          }
        }}
      >
        <SelectTrigger className={className}>
          <SelectValue>{currentLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {allTypes.map((t) => (
            <SelectItem
              key={t.value}
              value={t.value}
              className="text-foreground hover:bg-secondary pr-8 relative"
            >
              <span className="flex items-center gap-2 w-full">
                {t.label}
                {t.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, t.value)}
                    className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                    title="Remover tipo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            </SelectItem>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowNewType(true);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-primary hover:bg-secondary rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar novo tipo
            </button>
          </div>
        </SelectContent>
      </Select>

      {showNewType && (
        <div className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
          <Input
            autoFocus
            placeholder="Nome do novo tipo..."
            value={newTypeLabel}
            onChange={(e) => setNewTypeLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAddType(); }
              if (e.key === 'Escape') { setShowNewType(false); setNewTypeLabel(''); }
            }}
            className="bg-secondary border-border text-foreground h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddType}
            className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => { setShowNewType(false); setNewTypeLabel(''); }}
            className="h-8 px-2"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
