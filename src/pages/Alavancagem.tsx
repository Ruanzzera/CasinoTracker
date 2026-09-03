import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Rocket, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoulette } from '@/hooks/useRoulette';
import { BankrollHeader } from '@/components/roulette/BankrollHeader';
import { MatchDialog } from '@/components/roulette/MatchDialog';
import { MatchHistoryList } from '@/components/roulette/MatchHistoryList';
import { RouletteMetrics } from '@/components/roulette/RouletteMetrics';
import { ModesManagerDialog } from '@/components/roulette/ModesManagerDialog';

export default function Alavancagem() {
  const { user } = useAuth();
  const { project, modes, matches, loading, updateProject, saveMatch, deleteMatch, resetProject, createProject, createMode, updateMode, deleteMode } = useRoulette();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!user) return null;

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="p-3 rounded-lg bg-primary/20"><Rocket className="w-8 h-8 text-primary" /></div>
        <h1 className="text-2xl font-bold">Alavancagem</h1>
        <p className="text-muted-foreground max-w-md">
          Você ainda não tem um projeto de roleta. Crie um para começar a registrar partidas MD3.
        </p>
        <div className="flex gap-2">
          <Link to="/"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button></Link>
          <Button onClick={() => createProject(0, 10)}><Rocket className="w-4 h-4 mr-1" /> Criar projeto</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div className="p-2 rounded-lg bg-primary/20"><Rocket className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold">Alavancagem</h1>
              <p className="text-xs text-muted-foreground">Projeto roleta — estratégia MD3 nas dezenas (3x)</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => { if (confirm('Resetar todo o projeto? Apaga todas as partidas e volta a banca para o valor inicial.')) resetProject(); }}
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Resetar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <BankrollHeader
          project={project}
          onUpdate={updateProject}
          modesSlot={
            <ModesManagerDialog
              modes={modes}
              onCreate={createMode}
              onUpdate={updateMode}
              onDelete={deleteMode}
            />
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <MatchDialog modes={modes} onFinish={saveMatch} />
            <MatchHistoryList matches={matches} onDelete={deleteMatch} />
          </div>
          <div className="lg:col-span-2">
            <RouletteMetrics
              matches={matches}
              initialBankroll={project.initialBankroll}
              currentBankroll={project.currentBankroll}
            />
          </div>
        </div>
      </main>
    </div>
  );
}