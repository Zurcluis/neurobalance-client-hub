import React from 'react';

export const StatusLegend: React.FC = () => {
  const statuses = [
    { label: 'Livre', color: 'bg-[#e2f1e2] border-[#81c784]' },
    { label: 'Ocupada', color: 'bg-[#e0f2f3] border-[#3f9094]' },
    { label: 'A terminar (<10m)', color: 'bg-[#fff4e5] border-[#ff9800]' },
    { label: 'Atrasada', color: 'bg-[#ffebee] border-[#f44336]' },
    { label: 'Indisponível', color: 'bg-[#f5f5f5] border-[#c5cfce]' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-4 px-6 bg-white rounded-xl shadow-sm border border-slate-100 mt-6">
      <span className="text-sm font-semibold text-slate-500 mr-2 uppercase tracking-wider">Legenda:</span>
      {statuses.map((status) => (
        <div key={status.label} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-sm border-2 ${status.color}`} />
          <span className="text-sm text-slate-700">{status.label}</span>
        </div>
      ))}
    </div>
  );
};
