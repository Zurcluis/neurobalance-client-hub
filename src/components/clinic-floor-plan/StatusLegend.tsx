import React from 'react';

export const StatusLegend: React.FC = () => {
  const statuses = [
    { label: 'Livre', dot: 'bg-emerald-500' },
    { label: 'Ocupada', dot: 'bg-teal-600' },
    { label: 'A terminar (<10m)', dot: 'bg-amber-500' },
    { label: 'Atrasada / Excedida', dot: 'bg-red-500' },
    { label: 'Higienização', dot: 'bg-purple-500' },
    { label: 'Indisponível', dot: 'bg-muted-foreground' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-5 bg-card rounded-xl shadow-sm border mt-4">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legenda de Estado</span>
      <div className="flex flex-wrap items-center gap-4">
        {statuses.map((status) => (
          <div key={status.label} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${status.dot} ring-2 ring-background shadow-sm`} />
            <span className="text-xs text-muted-foreground">{status.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
