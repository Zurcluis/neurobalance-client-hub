import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  sessionCount: number;
  nextSession: string | null;
  totalPaid: number;
}

interface ClientCardProps {
  client: ClientData;
  onDelete: (id: string) => void;
}

const ClientCard = ({ client, onDelete }: ClientCardProps) => {
  const handleDelete = () => {
    onDelete(client.id);
    toast.success('Cliente eliminado com sucesso');
  };

  return (
    <div className="card-glass">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-neuro-soft-purple flex items-center justify-center">
            <User className="text-neuro-primary" />
          </div>
          <div className="ml-4">
            <h3 className="font-medium text-lg">{client.name}</h3>
            <p className="text-sm text-neuro-gray">{client.email}</p>
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
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-neuro-gray">Phone</p>
          <p>{client.phone}</p>
        </div>
        <div>
          <p className="text-neuro-gray">Sessions</p>
          <p>{client.sessionCount}</p>
        </div>
        <div>
          <p className="text-neuro-gray">Total Paid</p>
          <p>€{client.totalPaid.toFixed(2)}</p>
        </div>
      </div>
      
      {client.nextSession && (
        <div className="mt-4 flex items-center text-sm text-neuro-gray">
          <Calendar className="w-4 h-4 mr-1" />
          <span>Próxima sessão: {client.nextSession}</span>
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        <Link 
          to={`/clients/${client.id}`}
          className="px-4 py-2 bg-neuro-primary text-white rounded-lg text-sm hover:bg-neuro-secondary transition-colors"
        >
          Ver Perfil
        </Link>
      </div>
    </div>
  );
};

export default ClientCard;
