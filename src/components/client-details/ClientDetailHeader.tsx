import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, CreditCard, Mail, Phone, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { STATUS_META } from '@/utils/chartUtils';
import type { ClientDetailData } from '@/types/client';
import ClientTokenPanel from './ClientTokenPanel';
import { syncAllSessions } from '@/scripts/syncSessions';

const ESTADO_BADGE_CLASSES: Record<string, string> = {
  ongoing: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  thinking: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  finished: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  'no-need': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  desistiu: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
  call: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
};

const AVATAR_TONES = [
  'bg-teal-500/15 text-teal-700 dark:text-teal-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-blue-500/15 text-blue-700 dark:text-blue-300',
];

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const getAvatarTone = (name: string): string => {
  const index = name.charCodeAt(0) % AVATAR_TONES.length;
  return AVATAR_TONES[index];
};

interface ClientDetailHeaderProps {
  client: ClientDetailData;
  isPartner: boolean;
  backLink: string;
  notificationsCount: number;
  onGoToNotifications: () => void;
  onGoToPayments: () => void;
}

const ClientDetailHeader: React.FC<ClientDetailHeaderProps> = ({
  client,
  isPartner,
  backLink,
  notificationsCount,
  onGoToNotifications,
  onGoToPayments,
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const estadoLabel = client.estado
    ? STATUS_META[client.estado]?.label ?? client.estado
    : client.estado;

  const openWhatsApp = () => {
    if (!client.telefone) return;
    window.open(`https://wa.me/351${client.telefone.replace(/\D/g, '')}`, '_blank');
  };

  const handleSync = async () => {
    const promise = syncAllSessions();
    toast.promise(promise, {
      loading: 'A sincronizar sessões...',
      success: 'Sessões sincronizadas com sucesso!',
      error: 'Erro ao sincronizar sessões.',
    });
    await promise;
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <Link to={backLink}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full border border-border text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={onGoToNotifications}
            title="Notificações"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {notificationsCount}
              </span>
            )}
          </Button>

          <div className="hidden sm:flex items-center gap-2">
            {!isPartner && (
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={onGoToPayments}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Pagamento
              </Button>
            )}
            {client.telefone && (
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={openWhatsApp}
              >
                <Phone className="h-4 w-4 mr-1.5" />
                WhatsApp
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleSync}
            >
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Sincronizar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 min-w-0">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${getAvatarTone(client.nome)} flex items-center justify-center shadow-sm shrink-0`}
          >
            <span className="text-xl sm:text-2xl font-bold">{getInitials(client.nome)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                {client.nome}
              </h1>
              {client.estado && (
                <Badge
                  variant="outline"
                  className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${ESTADO_BADGE_CLASSES[client.estado] ?? 'bg-muted text-muted-foreground border-border'}`}
                >
                  {estadoLabel}
                </Badge>
              )}
              {client.id_manual && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  ID: {client.id_manual}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              {client.email && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(client.email || '', 'Email')}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{client.email}</span>
                </button>
              )}
              {client.telefone && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(client.telefone || '', 'Telefone')}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{client.telefone}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <ClientTokenPanel clientId={client.id} className="w-full lg:w-auto mt-4 lg:mt-0" />
      </div>

      {!isPartner && (
        <div className="flex sm:hidden items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={onGoToPayments}
          >
            <CreditCard className="h-4 w-4 mr-1.5" />
            Pagamento
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientDetailHeader;
