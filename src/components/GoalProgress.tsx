import { useState } from 'react';
import { Target, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { usePrivacy, PRIVACY_MASK } from '@/hooks/usePrivacy';


interface GoalProgressProps {
  type: 'daily' | 'monthly';
  label: string;
  currentAmount: number;
  targetAmount?: number;
  onSetGoal: (amount: number) => void;
}

export function GoalProgress({ type, label, currentAmount, targetAmount, onSetGoal }: GoalProgressProps) {
  const [editing, setEditing] = useState(false);
  const { hidden } = usePrivacy();

  const [inputValue, setInputValue] = useState(targetAmount?.toString() || '');

  const progress = targetAmount ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const isComplete = targetAmount && currentAmount >= targetAmount;

  const handleSave = () => {
    const value = parseFloat(inputValue.replace(',', '.'));
    if (value > 0) {
      onSetGoal(value);
      setEditing(false);
    }
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className={cn("w-4 h-4", isComplete ? "text-profit" : "text-primary")} />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        {!editing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setInputValue(targetAmount?.toString() || '');
              setEditing(true);
            }}
          >
            <Edit2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Meta (R$)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-8 bg-secondary border-border text-sm"
            autoFocus
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
            <Check className="w-4 h-4 text-profit" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(false)}>
            <X className="w-4 h-4 text-loss" />
          </Button>
        </div>
      ) : targetAmount ? (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <span className={cn("text-2xl font-bold", isComplete ? "text-profit" : "text-foreground")}>
              {hidden ? PRIVACY_MASK : `R$ ${currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </span>
            <span className="text-sm text-muted-foreground">
              / {hidden ? PRIVACY_MASK : `R$ ${targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </span>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {isComplete ? '🎉 Meta alcançada!' : `${progress.toFixed(0)}% da meta`}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Clique em editar para definir uma meta
        </p>
      )}
    </div>
  );
}
