import React from 'react';

export const StatusLegend: React.FC = () => {
  const statuses = [
    { label: 'Livre', color: 'bg-[#e2f1e2] border-[#81c784]', dot: 'bg-emerald-500' },
    { label: 'Ocupada', color: 'bg-[#e0f2f3] border-[#3f9094]', dot: 'bg-[#3f9094]' },
    { label: 'A terminar (<10m)', color: 'bg-[#fff4e5] border-[#ff9800]', dot: 'bg-amber-500' },
    { label: 'Atrasada / Excedida', color: 'bg-[#ffebee] border-[#f44336]', dot: 'bg-red-500' },
    { label: 'Higienização', color: 'bg-[#f3e8ff] border-[#c084fc]', dot: 'bg-purple-500' },
    { label: 'Indisponível', color: 'bg-[#f5f5f5] border-[#c5cfce]', dot: 'bg-gray-400' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 mt-4">
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Legenda de Estado:</span>
      <div className="flex flex-wrap items-center gap-4">
        {statuses.map((status) => (
          <div key={status.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${status.dot} ring-2 ring-white dark:ring-gray-800 shadow-sm`} />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{status.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

