import { useState } from 'react';
import { Pencil, Check, X, Wallet, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { RouletteProject } from '@/hooks/useRoulette';

interface Props {
  project: RouletteProject;
  onUpdate: (patch: Partial<RouletteProject>) => void;
  modesSlot?: React.ReactNode;
}

type Field = 'initialBankroll' | 'currentBankroll' | 'betValue';

function EditableCard({
  label, value, icon, onSave, valueClassName,
}: {
  label: string; value: number; icon: React.ReactNode;
  onSave: (v: number) => void; valueClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const start = () => { setDraft(String(value)); setEditing(true); };
  const commit = () => {
    const n = parseFloat(draft.replace(',', '.'));
    if (!Number.isNaN(n)) onSave(n);
    setEditing(false);
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}<span>{label}</span>
        </div>
        {!editing && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={start}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.01"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            className="h-9"
          />
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={commit}><Check className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
        </div>
      ) : (
        <div className={`text-2xl font-bold ${valueClassName ?? 'text-foreground'}`}>
          {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      )}
    </div>
  );
}

export function BankrollHeader({ project, onUpdate, modesSlot }: Props) {
  const profit = project.currentBankroll - project.initialBankroll;
  const roi = project.initialBankroll > 0 ? (profit / project.initialBankroll) * 100 : 0;
  const profitColor = profit >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="space-y-3">
      {modesSlot && <div className="flex justify-end">{modesSlot}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <EditableCard
        label="Banca inicial"
        value={project.initialBankroll}
        icon={<Wallet className="w-4 h-4" />}
        onSave={v => onUpdate({ initialBankroll: v })}
      />
      <EditableCard
        label="Banca atual"
        value={project.currentBankroll}
        icon={<Coins className="w-4 h-4" />}
        onSave={v => onUpdate({ currentBankroll: v })}
      />
      <div className="stat-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          {profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>Lucro / Prejuízo</span>
        </div>
        <div className={`text-2xl font-bold ${profitColor}`}>
          {profit >= 0 ? '+' : ''}{profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
        <div className={`text-xs mt-1 ${profitColor}`}>
          ROI {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
        </div>
      </div>
      <EditableCard
        label="Valor da aposta"
        value={project.betValue}
        icon={<Coins className="w-4 h-4" />}
        onSave={v => onUpdate({ betValue: v })}
      />
      </div>
    </div>
  );
}