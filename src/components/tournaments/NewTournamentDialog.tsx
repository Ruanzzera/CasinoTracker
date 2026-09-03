import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ComboboxInput } from '@/components/ComboboxInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Tournament } from '@/hooks/useTournaments';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  houses: string[];
  onCreate: (input: Partial<Tournament> & { house: string }) => Promise<string | null>;
  onCreated?: (id: string) => void;
}

function Hint({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger type="button" className="text-muted-foreground hover:text-foreground inline-flex">
          <HelpCircle className="w-3.5 h-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function NewTournamentDialog({ open, onOpenChange, houses, onCreate, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [house, setHouse] = useState('');
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [end, setEnd] = useState(new Date().toISOString().split('T')[0]);

  const [ppr, setPpr] = useState('1');
  const [initPos, setInitPos] = useState('0');
  const [initPts, setInitPts] = useState('0');

  const [prizeType, setPrizeType] = useState<'giros' | 'saldo_real'>('giros');
  const [spins, setSpins] = useState('0');
  const [spinsValue, setSpinsValue] = useState('0');
  const [cash, setCash] = useState('0');
  const [cutoff, setCutoff] = useState('0');

  const reset = () => {
    setStep(1); setName(''); setHouse(''); setPpr('1');
    setInitPos('0'); setInitPts('0'); setPrizeType('giros');
    setSpins('0'); setSpinsValue('0'); setCash('0'); setCutoff('0');
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const submit = async () => {
    if (!house) { toast.error('Informe a casa'); setStep(1); return; }
    setSubmitting(true);
    const id = await onCreate({
      name, house, startDate: start, endDate: end,
      pointsPerReal: parseFloat(ppr) || 1,
      prizeType,
      prizeSpinsCount: parseInt(spins) || 0,
      prizeSpinsValue: parseFloat(spinsValue) || 0,
      prizeCashValue: parseFloat(cash) || 0,
      initialPosition: parseInt(initPos) || 0,
      initialPoints: parseFloat(initPts) || 0,
      currentPosition: parseInt(initPos) || 0,
      prizePositionCutoff: parseInt(cutoff) || 0,
    });
    setSubmitting(false);
    if (id) {
      handleClose(false);
      onCreated?.(id);
    }
  };

  const next = () => {
    if (step === 1 && !house) { toast.error('Informe a casa'); return; }
    setStep(s => Math.min(3, s + 1));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Torneio · Passo {step} de 3</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Multibet Diário" />
            </div>
            <div>
              <Label>Casa *</Label>
              <ComboboxInput value={house} onChange={setHouse} suggestions={houses} placeholder="Ex: Betano" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Início</Label><Input type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
              <div><Label>Fim</Label><Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-1">Pontos / R$1 <Hint text="Quantos pontos o torneio dá para cada R$ 1,00 apostado." /></Label>
              <Input type="number" step="0.01" value={ppr} onChange={e => setPpr(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">Colocação inicial <Hint text="Sua posição no ranking quando o torneio começou (deixe 0 se não souber)." /></Label>
                <Input type="number" value={initPos} onChange={e => setInitPos(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-1">Pontuação inicial <Hint text="Pontos que você já tinha ao começar (carry-over). Deixe 0 se está começando do zero." /></Label>
                <Input type="number" step="0.01" value={initPts} onChange={e => setInitPts(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo de prêmio</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={prizeType === 'giros' ? 'default' : 'outline'} onClick={() => setPrizeType('giros')}>Giros</Button>
                <Button type="button" variant={prizeType === 'saldo_real' ? 'default' : 'outline'} onClick={() => setPrizeType('saldo_real')}>Saldo Real</Button>
              </div>
            </div>
            {prizeType === 'giros' ? (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Qtd Giros</Label><Input type="number" value={spins} onChange={e => setSpins(e.target.value)} /></div>
                <div><Label>Bet do giro (R$)</Label><Input type="number" step="0.01" value={spinsValue} onChange={e => setSpinsValue(e.target.value)} /></div>
              </div>
            ) : (
              <div><Label>Valor do prêmio (R$)</Label><Input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} /></div>
            )}
            <div>
              <Label className="flex items-center gap-1">Premia até a colocação <Hint text="A última posição premiada do torneio. Ex: 50 = paga até o 50º colocado. Deixe 0 para 'sem corte'." /></Label>
              <Input type="number" value={cutoff} onChange={e => setCutoff(e.target.value)} placeholder="0 = ilimitado" />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={next} className="ml-auto gap-1">Próximo <ArrowRight className="w-4 h-4" /></Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="ml-auto gap-1">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Torneio'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}