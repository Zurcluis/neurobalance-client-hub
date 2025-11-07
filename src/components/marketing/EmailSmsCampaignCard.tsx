import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmailSmsCampaign } from '@/types/email-sms-campaign';
import { Mail, MessageSquare, Edit, Trash2, Send, Calendar, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailSmsCampaignCardProps {
  campaign: EmailSmsCampaign;
  onEdit: (campaign: EmailSmsCampaign) => void;
  onDelete: (id: string) => void;
  onSend?: (id: string) => void;
}

export const EmailSmsCampaignCard: React.FC<EmailSmsCampaignCardProps> = ({
  campaign,
  onEdit,
  onDelete,
  onSend,
}) => {
  const getStatusBadge = () => {
    const statusColors = {
      rascunho: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      agendada: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      enviando: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      concluida: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    const statusLabels = {
      rascunho: 'Rascunho',
      agendada: 'Agendada',
      enviando: 'Enviando',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
    };

    return (
      <Badge className={statusColors[campaign.status]}>
        {statusLabels[campaign.status]}
      </Badge>
    );
  };

  const getTypeIcon = () => {
    return campaign.tipo === 'email' ? (
      <Mail className="h-5 w-5" />
    ) : (
      <MessageSquare className="h-5 w-5" />
    );
  };

  const taxaAbertura = campaign.enviados > 0 
    ? ((campaign.aberturas / campaign.enviados) * 100).toFixed(1)
    : '0';

  const taxaClique = campaign.enviados > 0
    ? ((campaign.cliques / campaign.enviados) * 100).toFixed(1)
    : '0';

  const taxaConversao = campaign.enviados > 0
    ? ((campaign.conversoes / campaign.enviados) * 100).toFixed(1)
    : '0';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-1 truncate">{campaign.nome}</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge()}
                <Badge variant="outline" className="text-xs">
                  {campaign.tipo.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assunto:
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {campaign.assunto || 'N/A'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Clientes</p>
              <p className="text-sm font-semibold">{campaign.total_clientes}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Enviados</p>
              <p className="text-sm font-semibold">{campaign.enviados}</p>
            </div>
          </div>
        </div>

        {campaign.status === 'concluida' && campaign.enviados > 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Taxa de Abertura</span>
              <span className="font-semibold">{taxaAbertura}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Taxa de Clique</span>
              <span className="font-semibold">{taxaClique}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Taxa de Conversão</span>
              <span className="font-semibold text-green-600">{taxaConversao}%</span>
            </div>
          </div>
        )}

        {campaign.data_envio && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(campaign.data_envio), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(campaign)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          {campaign.status === 'rascunho' && onSend && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onSend(campaign.id)}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(campaign.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

