import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Phone, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clientes']['Row'];

interface ClientCardProps {
  client: Client;
  onDelete: () => void;
  statusClass?: string;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onDelete, statusClass = '' }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/clients/${client.id}`);
  };

  return (
    <Card className={`relative overflow-hidden ${statusClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold truncate">{client.nome}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm truncate">{client.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="text-sm">{client.telefone}</span>
          </div>
          {client.proxima_sessao && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Próxima Sessão: {new Date(client.proxima_sessao).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-500 hover:text-red-600"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Apagar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
