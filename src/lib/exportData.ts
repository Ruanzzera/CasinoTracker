import { CasinoEntry, entryTypeLabels } from '@/types/casino';
import { formatDateBRT } from '@/lib/timezone';

export function exportToCSV(entries: CasinoEntry[], filename: string = 'casino_data') {
  const headers = ['Data', 'Valor (R$)', 'Tipo', 'Casa', 'Jogo', 'Notas'];
  
  const rows = entries.map(entry => [
    formatDateBRT(entry.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    entry.amount.toFixed(2).replace('.', ','),
    entryTypeLabels[entry.type],
    entry.house,
    entry.game,
    entry.notes || '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateShareText(stats: {
  totalProfit: number;
  entriesCount: number;
  bestHouse?: { house: string; total: number } | null;
  bestGame?: { game: string; total: number } | null;
}) {
  const lines = [
    '🎰 Minhas Estatísticas de Cassino',
    '',
    `💰 Lucro Total: R$ ${stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `📊 Total de Entradas: ${stats.entriesCount}`,
  ];

  if (stats.bestHouse) {
    lines.push(`🏠 Melhor Casa: ${stats.bestHouse.house} (R$ ${stats.bestHouse.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
  }

  if (stats.bestGame) {
    lines.push(`🎮 Melhor Jogo: ${stats.bestGame.game} (R$ ${stats.bestGame.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
  }

  return lines.join('\n');
}
