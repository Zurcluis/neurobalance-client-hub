import React from 'react';
import { RoomData } from './types';
import { CheckCircle2, Clock, Users, XCircle } from 'lucide-react';

interface SummaryCardsProps {
  rooms: RoomData[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ rooms }) => {
  const totals = {
    livre: rooms.filter((r) => r.status === 'livre').length,
    ocupada: rooms.filter((r) => r.status === 'ocupada' || r.status === 'a_terminar' || r.status === 'atrasada').length,
    a_terminar: rooms.filter((r) => r.status === 'a_terminar').length,
    indisponivel: rooms.filter((r) => r.status === 'indisponivel').length,
  };

  const cards = [
    {
      title: 'Salas Livres',
      value: totals.livre,
      icon: <CheckCircle2 className="w-6 h-6 text-[#4caf50]" />,
      bg: 'bg-[#e8f5e9]',
      text: 'text-[#2e7d32]'
    },
    {
      title: 'Em Sessão',
      value: totals.ocupada,
      icon: <Users className="w-6 h-6 text-[#3f9094]" />,
      bg: 'bg-[#e0f2f3]',
      text: 'text-[#265255]'
    },
    {
      title: 'A Terminar',
      value: totals.a_terminar,
      icon: <Clock className="w-6 h-6 text-[#ff9800]" />,
      bg: 'bg-[#fff3e0]',
      text: 'text-[#e65100]'
    },
    {
      title: 'Indisponíveis',
      value: totals.indisponivel,
      icon: <XCircle className="w-6 h-6 text-[#9e9e9e]" />,
      bg: 'bg-[#f5f5f5]',
      text: 'text-[#616161]'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between transition-transform hover:-translate-y-1 duration-200">
          <div>
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <p className={`text-2xl font-bold mt-1 ${card.text}`}>{card.value}</p>
          </div>
          <div className={`p-3 rounded-full ${card.bg}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
