import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, User, CalendarDays, CreditCard, Target, ArrowRight, Euro, Sparkles, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { useAppointments } from '@/hooks/useAppointments';
import { usePayments } from '@/hooks/usePayments';
import { useLandingLeads } from '@/hooks/useLandingLeads';
import { parseISO, isValid, isToday } from 'date-fns';
import { formatCurrency } from '@/utils/formatUtils';
import { getIntentLabel, NLP_EXAMPLE_QUERIES, parseNlpQuery } from '@/utils/nlpQuery';

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  path?: string;
}

interface SearchGroup {
  id: string;
  label: string;
  items: SearchItem[];
}

interface QuickAction {
  id: string;
  label: string;
  path: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_ITEMS_PER_GROUP = 6;

const isPendingPayment = (payment: unknown): boolean => {
  const estado = (payment as { estado?: string | null } | null)?.estado;
  return estado?.toLowerCase() === 'pendente';
};

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { clients } = useClients();
  const { appointments } = useAppointments();
  const { payments } = usePayments();
  const { leads } = useLandingLeads();

  const parsed = useMemo(() => parseNlpQuery(searchQuery), [searchQuery]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const { groups, quickActions } = useMemo(() => {
    const builtGroups: SearchGroup[] = [];
    const builtActions: QuickAction[] = [];
    const query = parsed.intent === 'generic' ? parsed.text.toLowerCase() : '';

    if (!searchQuery.trim()) {
      return { groups: builtGroups, quickActions: builtActions };
    }

    if (parsed.intent === 'generic') {
      const clientItems: SearchItem[] = [];
      if (clients && clients.length > 0 && query) {
        clients.forEach((client) => {
          const haystack = [client.nome, client.email, client.telefone, client.id_manual]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (haystack.includes(query)) {
            clientItems.push({
              id: `client-${client.id}`,
              title: client.nome || '',
              subtitle: client.email || client.telefone || undefined,
              icon: User,
              path: `/clients/${client.id}`,
            });
          }
        });
      }
      if (clientItems.length > 0) {
        builtGroups.push({ id: 'clients', label: 'Clientes', items: clientItems.slice(0, MAX_ITEMS_PER_GROUP) });
      }

      const appointmentItems: SearchItem[] = [];
      if (appointments && appointments.length > 0 && query) {
        appointments.forEach((appointment) => {
          const haystack = [appointment.titulo, appointment.notas]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (haystack.includes(query)) {
            const client = clients?.find((c) => c.id === appointment.id_cliente);
            appointmentItems.push({
              id: `appointment-${appointment.id}`,
              title: appointment.titulo || 'Consulta',
              subtitle: client ? `Cliente: ${client.nome || ''}` : appointment.data,
              icon: CalendarDays,
              path: '/calendar',
            });
          }
        });
      }
      if (appointmentItems.length > 0) {
        builtGroups.push({
          id: 'appointments',
          label: 'Agendamentos',
          items: appointmentItems.slice(0, MAX_ITEMS_PER_GROUP),
        });
      }

      const paymentItems: SearchItem[] = [];
      if (payments && payments.length > 0 && query) {
        payments.forEach((payment) => {
          const haystack = [payment.cliente_nome, payment.descricao, payment.tipo]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (haystack.includes(query)) {
            paymentItems.push({
              id: `payment-${payment.id}`,
              title: payment.cliente_nome || payment.descricao || 'Pagamento',
              subtitle: `${formatCurrency(payment.valor)} · ${payment.data}`,
              icon: CreditCard,
              path: '/finances',
            });
          }
        });
      }
      if (paymentItems.length > 0) {
        builtGroups.push({
          id: 'payments',
          label: 'Pagamentos',
          items: paymentItems.slice(0, MAX_ITEMS_PER_GROUP),
        });
      }

      return { groups: builtGroups, quickActions: builtActions };
    }

    if (parsed.intent === 'pack_ending') {
      const items: SearchItem[] = [];
      (clients || []).forEach((client) => {
        const maxSessions = client.max_sessoes ?? 0;
        const remaining = maxSessions - (client.numero_sessoes ?? 0);
        if (maxSessions > 0 && remaining <= 2) {
          items.push({
            id: `pack-${client.id}`,
            title: client.nome || '',
            subtitle: `Restam ${Math.max(0, remaining)} de ${maxSessions} sessões do pack`,
            icon: User,
            path: `/clients/${client.id}`,
          });
        }
      });
      builtGroups.push({ id: 'pack-clients', label: 'Clientes', items: items.slice(0, MAX_ITEMS_PER_GROUP) });
      builtActions.push({
        id: 'action-pack',
        label: 'Ver na gestão de clientes',
        path: '/clients?tab=clients&filter=pack-ending',
      });
    }

    if (parsed.intent === 'payments_overdue') {
      const items: SearchItem[] = (payments || [])
        .filter(isPendingPayment)
        .map((payment) => ({
          id: `overdue-${payment.id}`,
          title: payment.cliente_nome || payment.descricao || 'Pagamento pendente',
          subtitle: `${formatCurrency(payment.valor)} · ${payment.data}`,
          icon: CreditCard,
          path: '/finances',
        }));
      builtGroups.push({ id: 'overdue-payments', label: 'Pagamentos', items: items.slice(0, MAX_ITEMS_PER_GROUP) });
      builtActions.push({ id: 'action-overdue', label: 'Abrir finanças', path: '/finances' });
    }

    if (parsed.intent === 'sessions_today') {
      const items: SearchItem[] = (appointments || [])
        .filter((appointment) => {
          const date = parseISO(appointment.data);
          return isValid(date) && isToday(date) && appointment.estado !== 'cancelado';
        })
        .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
        .map((appointment) => {
          const client = clients?.find((c) => c.id === appointment.id_cliente);
          return {
            id: `today-${appointment.id}`,
            title: appointment.titulo || 'Consulta',
            subtitle: [client?.nome, appointment.hora].filter(Boolean).join(' · '),
            icon: CalendarDays,
            path: '/calendar',
          };
        });
      builtGroups.push({ id: 'today-sessions', label: 'Agendamentos', items: items.slice(0, MAX_ITEMS_PER_GROUP) });
      builtActions.push({ id: 'action-today', label: 'Abrir calendário', path: '/calendar' });
    }

    if (parsed.intent === 'leads_cold') {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const items: SearchItem[] = (leads || [])
        .filter((lead) => {
          const isColdStatus = lead.status === 'Novo' || lead.status === 'Contactado';
          const created = parseISO(lead.created_at);
          return isColdStatus && isValid(created) && created.getTime() < cutoff;
        })
        .map((lead) => ({
          id: `lead-${lead.id}`,
          title: lead.nome,
          subtitle: `${lead.status} · ${lead.origem}`,
          icon: Target,
          path: '/clients?tab=leads',
        }));
      builtGroups.push({ id: 'cold-leads', label: 'Leads', items: items.slice(0, MAX_ITEMS_PER_GROUP) });
      builtActions.push({ id: 'action-leads', label: 'Abrir leads', path: '/clients?tab=leads' });
    }

    if (parsed.intent === 'revenue_month' && parsed.month !== undefined) {
      const month = parsed.month;
      const now = new Date();
      const year = month <= now.getMonth() ? now.getFullYear() : now.getFullYear() - 1;
      const monthPayments = (payments || []).filter((payment) => {
        const date = parseISO(payment.data);
        return isValid(date) && date.getMonth() === month && date.getFullYear() === year;
      });
      const total = monthPayments.reduce((sum, payment) => sum + (payment.valor || 0), 0);

      if (monthPayments.length > 0) {
        builtGroups.push({
          id: 'revenue-total',
          label: 'Total',
          items: [
            {
              id: 'revenue-total-item',
              title: formatCurrency(total),
              subtitle: `${monthPayments.length} pagamentos`,
              icon: Euro,
              path: '/finances',
            },
          ],
        });
      }

      const byClient = new Map<string, number>();
      monthPayments.forEach((payment) => {
        const key = payment.cliente_nome || 'Sem cliente';
        byClient.set(key, (byClient.get(key) || 0) + (payment.valor || 0));
      });
      const items: SearchItem[] = Array.from(byClient.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({
          id: `revenue-${name}`,
          title: name,
          subtitle: formatCurrency(value),
          icon: CreditCard,
          path: '/finances',
        }));
      builtGroups.push({ id: 'revenue-clients', label: 'Por cliente', items: items.slice(0, MAX_ITEMS_PER_GROUP) });
      builtActions.push({ id: 'action-revenue', label: 'Abrir finanças', path: '/finances' });
    }

    return { groups: builtGroups, quickActions: builtActions };
  }, [parsed, searchQuery, clients, appointments, payments, leads]);

  const hasResults = groups.some((group) => group.items.length > 0);

  const handleResultClick = (item: SearchItem) => {
    if (item.path) {
      navigate(item.path);
    }
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleActionClick = (action: QuickAction) => {
    navigate(action.path);
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleExampleClick = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Pesquisar</DialogTitle>
          <DialogDescription>
            Pesquise por clientes, agendamentos e outras informações
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Pesquisar ou escrever em linguagem natural..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {!searchQuery.trim() ? (
            <div className="p-2 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-1">
                Experimente
              </p>
              {NLP_EXAMPLE_QUERIES.map((example) => (
                <Button
                  key={example.query}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 font-normal"
                  onClick={() => handleExampleClick(example.query)}
                >
                  <Sparkles className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{example.query}</span>
                </Button>
              ))}
            </div>
          ) : hasResults ? (
            <div className="space-y-2">
              {parsed.intent !== 'generic' && (
                <p className="px-2 pt-1 text-xs font-medium text-muted-foreground">
                  {getIntentLabel(parsed)}
                </p>
              )}
              {quickActions.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 py-1">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleActionClick(action)}
                    >
                      {action.label}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                </div>
              )}
              {groups.map((group) =>
                group.items.length > 0 ? (
                  <div key={group.id} className="space-y-1">
                    <p className="px-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => handleResultClick(item)}
                          >
                            <item.icon className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <span className="block font-medium truncate">{item.title}</span>
                              {item.subtitle && (
                                <span className="block text-sm text-muted-foreground truncate">
                                  {item.subtitle}
                                </span>
                              )}
                            </span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
