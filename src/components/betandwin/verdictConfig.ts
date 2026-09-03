export const verdictConfig = {
  viable: { label: '🟢 Viável', color: 'bg-primary/10 text-primary border-primary/30' },
  marginal: { label: '🟡 Marginal', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  inviable: { label: '🔴 Inviável', color: 'bg-destructive/10 text-destructive border-destructive/30' },
  no_data: { label: '⏳ Sem dados', color: 'bg-muted text-muted-foreground border-border' },
} as const;