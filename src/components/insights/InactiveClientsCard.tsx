import { useMemo, useState } from 'react';
import { CalendarX2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import WinBackMessageDialog from './WinBackMessageDialog';
import {
  INACTIVE_DEFAULT_WEEKS,
  findInactiveClients,
} from '@/utils/clientInsights';
import type { InsightAppointment } from '@/utils/clientInsights';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clientes']['Row'];

interface InactiveClientsCardProps {
  clients: Client[];
  appointments: InsightAppointment[];
}

const InactiveClientsCard = ({ clients, appointments }: InactiveClientsCardProps) => {
  const [weeks, setWeeks] = useState(INACTIVE_DEFAULT_WEEKS);
  const [dialogClient, setDialogClient] = useState<{ name: string; days: number | null } | null>(null);

  const inactiveClients = useMemo(
    () => findInactiveClients(clients, appointments, weeks),
    [clients, appointments, weeks]
  );

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">Clientes inativos</CardTitle>
            <CardDescription className="mt-1">
              Sem sessão marcada há pelo menos {weeks} semanas e com plano não concluído
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período</span>
            <Select value={String(weeks)} onValueChange={(value) => setWeeks(Number(value))}>
              <SelectTrigger className="h-9 w-[9rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 semanas</SelectItem>
                <SelectItem value="6">6 semanas</SelectItem>
                <SelectItem value="8">8 semanas</SelectItem>
                <SelectItem value="12">12 semanas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {inactiveClients.length === 0 ? (
          <EmptyState
            icon={<CalendarX2 className="h-8 w-8" />}
            title="Sem clientes inativos"
            description={`Todos os clientes ativos tiveram sessões nos últimos ${weeks} semanas.`}
          />
        ) : (
          <div className="space-y-2">
            {inactiveClients.map((client) => (
              <div
                key={client.clientId}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{client.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.lastSessionDate
                      ? `Última marcação: ${format(parseISO(client.lastSessionDate), 'dd/MM/yyyy', { locale: pt })}`
                      : 'Sem marcações registadas'}
                    {client.daysInactive !== null ? ` · ${client.daysInactive} dias` : ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={() =>
                    setDialogClient({ name: client.nome, days: client.daysInactive })
                  }
                >
                  <MessageSquare className="h-4 w-4" />
                  Preparar mensagem
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <WinBackMessageDialog
        open={dialogClient !== null}
        onOpenChange={(open) => {
          if (!open) setDialogClient(null);
        }}
        clientName={dialogClient?.name ?? ''}
        daysInactive={dialogClient?.days ?? null}
      />
    </Card>
  );
};

export default InactiveClientsCard;
