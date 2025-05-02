import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  sessionCount: number;
  nextSession: string | null;
  totalPaid: number;
  status?: 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'call';
}

interface ClientCardProps {
  client: ClientData;
  onDelete: (id: string) => void;
  statusClass?: string;
}

const ClientCard = ({ client, onDelete, statusClass }: ClientCardProps) => {
  const handleDelete = () => {
    onDelete(client.id);
    toast.success('Cliente eliminado com sucesso');
  };

  const getStatusLabel = (status?: string) => {
    switch(status) {
      case 'ongoing': return 'On Going';
      case 'thinking': return 'Thinking';
      case 'no-need': return 'No Need';
      case 'finished': return 'Finished';
      case 'call': return 'Call';
      default: return 'On Going';
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'ongoing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'thinking': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'no-need': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'finished': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'call': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    }
  };

  return (
    <div className={`dashboard-card ${statusClass || ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-[#E6ECEA] flex items-center justify-center">
            <User className="text-[#3A726D]" />
          </div>
          <div className="ml-4">
            <h3 className="font-medium text-lg">{client.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{client.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="mt-3">
        <Badge className={`${getStatusColor(client.status)}`}>
          {getStatusLabel(client.status)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-300">Telefone</p>
          <p>{client.phone}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-300">Sessões</p>
          <p>{client.sessionCount}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-300">Total Pago</p>
          <p>€{client.totalPaid.toFixed(2)}</p>
        </div>
      </div>
      
      {client.nextSession && (
        <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Calendar className="w-4 h-4 mr-1" />
          <span>Próxima sessão: {client.nextSession}</span>
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        <Link 
          to={`/clients/${client.id}`}
          className="px-4 py-2 bg-[#3A726D] text-white rounded-lg text-sm hover:bg-[#2A5854] transition-colors"
        >
          Ver Perfil
        </Link>
      </div>
    </div>
  );
};

export default ClientCard;
