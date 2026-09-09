export const CHART = {
  primary: '#3f9094',
  soft: '#5DA399',
  red: '#f87171',
  green: '#10b981',
};

export const STATUS_META: Record<string, { label: string; color: string }> = {
  ongoing: { label: 'Em andamento', color: CHART.primary },
  thinking: { label: 'Pensando', color: '#f59e0b' },
  'no-need': { label: 'Sem necessidade', color: '#9ca3af' },
  finished: { label: 'Finalizado', color: '#60a5fa' },
  call: { label: 'Ligar', color: '#a78bfa' },
  desistiu: { label: 'Desistiu', color: CHART.red },
};

export const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--card-foreground))',
  fontSize: '12px',
} as const;

export const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
} as const;

export const compactCurrency = (value: number) =>
  `€${new Intl.NumberFormat('pt-PT', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`;
