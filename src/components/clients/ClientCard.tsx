import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Trash2, 
  Edit, 
  Phone, 
  Mail, 
  Calendar, 
  User,
  Clock,
  ChevronRight,
  Activity,
  Sparkles,
  Key,
  Copy,
  Link,
  ExternalLink,
  Loader2,
  Check
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';
import { useAdminContext } from '@/contexts/AdminContext';
import { getFirstAndLastName, getInitials } from '@/utils/nameUtils';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Client = Database['public']['Tables']['clientes']['Row'];

interface ClientCardProps {
  client: Client;
  onDelete: () => void;
  statusClass?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  ongoing: {
    label: 'Em Andamento',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: <Activity className="h-3 w-3" />
  },
  thinking: {
    label: 'Pensando',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: <Clock className="h-3 w-3" />
  },
  'no-need': {
    label: 'Sem Necessidade',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: <User className="h-3 w-3" />
  },
  finished: {
    label: 'Finalizado',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: <Sparkles className="h-3 w-3" />
  },
  desistiu: {
    label: 'Desistiu',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: <User className="h-3 w-3" />
  }
};

const ClientCard: React.FC<ClientCardProps> = ({ client, onDelete, statusClass = '' }) => {
  const navigate = useNavigate();
  const { isAdminContext } = useAdminContext();
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  const handleEdit = () => {
    navigate(isAdminContext ? `/admin/clients/${client.id}` : `/clients/${client.id}`);
  };

  // Copiar para área de transferência
  const copyToClipboard = async (text: string, itemType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemType);
      toast.success(`${itemType} copiado!`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  // Gerar token de acesso
  const generateToken = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsGeneratingToken(true);
      
      const { data, error } = await supabase.rpc<any, any>('create_client_access_token', {
        client_id: client.id,
        expires_hours: 24 * 30 // 30 dias
      });

      if (error) throw error;

      setActiveToken(data);
      await copyToClipboard(data, 'Token');
      toast.success('Token gerado e copiado!');
    } catch (error: any) {
      console.error('Erro ao gerar token:', error);
      toast.error('Erro ao gerar token');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // Gerar link de acesso
  const getLoginLink = (token: string) => {
    return `${window.location.origin}/client-login?token=${token}`;
  };

  // Copiar link de acesso
  const copyLoginLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeToken) {
      await copyToClipboard(getLoginLink(activeToken), 'Link');
    } else {
      // Gerar token primeiro e depois copiar link
      try {
        setIsGeneratingToken(true);
        const { data, error } = await supabase.rpc<any, any>('create_client_access_token', {
          client_id: client.id,
          expires_hours: 24 * 30
        });

        if (error) throw error;

        setActiveToken(data);
        await copyToClipboard(getLoginLink(data), 'Link');
      } catch (error: any) {
        console.error('Erro ao gerar token:', error);
        toast.error('Erro ao gerar token');
      } finally {
        setIsGeneratingToken(false);
      }
    }
  };

  // Abrir link diretamente
  const openLoginLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeToken) {
      window.open(getLoginLink(activeToken), '_blank');
    } else {
      try {
        setIsGeneratingToken(true);
        const { data, error } = await supabase.rpc<any, any>('create_client_access_token', {
          client_id: client.id,
          expires_hours: 24 * 30
        });

        if (error) throw error;

        setActiveToken(data);
        window.open(getLoginLink(data), '_blank');
      } catch (error: any) {
        console.error('Erro ao gerar token:', error);
        toast.error('Erro ao gerar token');
      } finally {
        setIsGeneratingToken(false);
      }
    }
  };

  const status = client.estado || 'ongoing';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.ongoing;

  // Format next session date
  const nextSessionFormatted = client.proxima_sessao && isValid(parseISO(client.proxima_sessao))
    ? format(parseISO(client.proxima_sessao), "dd MMM 'às' HH:mm", { locale: ptBR })
    : null;

  // Get avatar colors based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-[#3f9094] to-[#2A5854]',
      'from-blue-500 to-blue-700',
      'from-purple-500 to-purple-700',
      'from-pink-500 to-pink-700',
      'from-amber-500 to-amber-700',
      'from-emerald-500 to-emerald-700',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-[#3f9094]/40 cursor-pointer ${statusClass}`}
      onClick={handleEdit}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3f9094] to-[#5DA399] opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardContent className="p-5">
        {/* Header with Avatar and Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className={`h-12 w-12 bg-gradient-to-br ${getAvatarColor(client.nome)} shadow-md`}>
              <AvatarFallback className="text-white font-semibold text-sm">
                {getInitials(client.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-[#3f9094] transition-colors">
                {getFirstAndLastName(client.nome)}
              </h3>
              {client.id_manual && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {client.id_manual}
                </span>
              )}
            </div>
          </div>
          
          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border gap-1 text-xs font-medium`}>
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Contact Info */}
        <div className="space-y-2.5 mb-4">
          {client.email && (
            <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                <Mail className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <span className="text-sm truncate">{client.email}</span>
            </div>
          )}
          
          {client.telefone && (
            <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                <Phone className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <span className="text-sm">{client.telefone}</span>
            </div>
          )}
          
          {nextSessionFormatted && (
            <div className="flex items-center gap-2.5 text-[#3f9094]">
              <div className="p-1.5 bg-[#3f9094]/10 rounded-md">
                <Calendar className="h-3.5 w-3.5 text-[#3f9094]" />
              </div>
              <span className="text-sm font-medium">Próxima: {nextSessionFormatted}</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {(client.numero_sessoes !== null && client.numero_sessoes !== undefined) && (
          <div className="flex items-center gap-4 py-2.5 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-[#3f9094]">{client.numero_sessoes || 0}</p>
              <p className="text-xs text-gray-500">Sessões</p>
            </div>
            {client.max_sessoes && client.max_sessoes > 0 && (
              <>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{client.max_sessoes}</p>
                  <p className="text-xs text-gray-500">Máx. Sessões</p>
                </div>
              </>
            )}
            {client.total_pago && client.total_pago > 0 && (
              <>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-emerald-600">€{client.total_pago}</p>
                  <p className="text-xs text-gray-500">Pago</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {/* Botões de Token/Link */}
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    onClick={generateToken}
                    disabled={isGeneratingToken}
                  >
                    {isGeneratingToken ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : copiedItem === 'Token' ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Key className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5 hidden sm:inline">Token</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gerar e copiar token</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={copyLoginLink}
                    disabled={isGeneratingToken}
                  >
                    {copiedItem === 'Link' ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5 hidden sm:inline">Link</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copiar link de acesso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                    onClick={openLoginLink}
                    disabled={isGeneratingToken}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="ml-1.5 hidden sm:inline">Abrir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Abrir portal do cliente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Botões principais */}
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Ver Perfil
              <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientCard;
