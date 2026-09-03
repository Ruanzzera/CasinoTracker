import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CasinoEntry, entryTypeLabels } from '@/types/casino';
import { toBRT } from '@/lib/timezone';

interface AdvancedChartsProps {
  entries: CasinoEntry[];
}

export function AdvancedCharts({ entries }: AdvancedChartsProps) {
  // Monthly evolution data
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    entries.forEach(entry => {
      const date = toBRT(entry.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, (monthMap.get(key) || 0) + entry.amount);
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, total]) => {
        const [year, m] = month.split('-');
        return {
          month: `${m}/${year.slice(2)}`,
          total,
        };
      });
  }, [entries]);

  // Get top 5 houses for the legend
  const topHouses = useMemo(() => {
    const houseMap = new Map<string, number>();
    entries.forEach(e => {
      houseMap.set(e.house, (houseMap.get(e.house) || 0) + e.amount);
    });
    return Array.from(houseMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, [entries]);

  // House comparison over time
  const houseComparisonData = useMemo(() => {
    const houseMonthMap = new Map<string, Map<string, number>>();

    entries.forEach(entry => {
      const date = toBRT(entry.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!houseMonthMap.has(monthKey)) {
        houseMonthMap.set(monthKey, new Map());
      }
      
      const monthData = houseMonthMap.get(monthKey)!;
      monthData.set(entry.house, (monthData.get(entry.house) || 0) + entry.amount);
    });

    return Array.from(houseMonthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, data]) => {
        const [year, m] = month.split('-');
        const result: Record<string, string | number> = { month: `${m}/${year.slice(2)}` };
        topHouses.forEach(house => {
          result[house] = data.get(house) || 0;
        });
        return result;
      });
  }, [entries, topHouses]);

  const colors = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Monthly Evolution */}
      <div className="stat-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Evolução Mensal</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickFormatter={(value) => `R$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* House Comparison */}
      {houseComparisonData.length > 0 && topHouses.length > 1 && (
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Comparativo por Casa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={houseComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                {topHouses.map((house, i) => (
                  <Line
                    key={house}
                    type="monotone"
                    dataKey={house}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2}
                    dot={{ fill: colors[i % colors.length] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
