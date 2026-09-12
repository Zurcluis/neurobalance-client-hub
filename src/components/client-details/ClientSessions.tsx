import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, Check, Clock, Edit, Filter, Link2Off, RefreshCw, SortAsc, SortDesc, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Progress } from '@/components/ui/progress';
import { parseISO, isAfter, isBefore, isValid, format } from 'date-fns';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import KpiCard from '@/components/shared/KpiCard';
import type { ClientDetailData, Session } from '@/types/client';
import type { Appointment } from '@/hooks/useAppointments';
import SessionEditDialog from './SessionEditDialog';
import SessionSummaryDialog from './SessionSummaryDialog';
import UpcomingAppointmentsCard from './UpcomingAppointmentsCard';
import StatusBadge from './StatusBadge';
import {
  formatSessionDateTime,
  formatSessionDuration,
  getSessionTypeLabel,
  loadSessionFilesMap,
  mergeSessionFiles,
  processSessionFiles,
  type RealizedSessionView,
} from './sessionView';
import { readClientMoods } from '@/utils/sessionSummary';

interface ClientSessionsProps {
  sessions: Session[];
  clientId: string;
  client: ClientDetailData;
  appointments: Appointment[];
  isLoadingAppointments: boolean;
  appointmentsError: string | null;
  onRefetchAppointments: () => void;
  onUpdateClient: (client: ClientDetailData) => void;
  onUpdateSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  paidSessionsCount?: number;
}

const getAppointmentDate = (appointment: Appointment): Date | null => {
  const parsed = parseISO(appointment.data);
  return isValid(parsed) ? parsed : null;
};

const ClientSessions = ({
  sessions,
  clientId,
  client,
  appointments,
  isLoadingAppointments,
  appointmentsError,
  onRefetchAppointments,
  onUpdateClient,
  onUpdateSession,
  onDeleteSession,
  paidSessionsCount,
}: ClientSessionsProps) => {
  const navigate = useNavigate();
  const [isMaxSessionsDialogOpen, setIsMaxSessionsDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<RealizedSessionView | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<RealizedSessionView | null>(null);
  const [syncProgress, setSyncProgress] = useState(false);
  const [sessionFilesMap, setSessionFilesMap] = useState<Record<string, RealizedSessionView['arquivos']>>(
    () => loadSessionFilesMap()
  );
  const lastUpdatedValueRef = useRef<number>(-1);

  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchText, setSearchText] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const maxSessionsForm = useForm<{ maxSessions: number }>({
    defaultValues: { maxSessions: client.max_sessoes || 0 },
  });

  useEffect(() => {
    maxSessionsForm.reset({ maxSessions: client.max_sessoes || 0 });
  }, [client.max_sessoes, maxSessionsForm]);

  const [pastCalendarAppointments, setPastCalendarAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (isLoadingAppointments || !client.id) return;

    const clientAppointments = appointments.filter(apt => apt.id_cliente === client.id);
    const now = new Date();

    const pastAppointments = clientAppointments.filter(app => {
      const appDate = getAppointmentDate(app);
      return appDate !== null && (isBefore(appDate, now) || app.estado === 'realizado');
    });

    const futureAppointments = clientAppointments.filter(app => {
      const appDate = getAppointmentDate(app);
      return appDate !== null &&
        isAfter(appDate, now) &&
        app.estado !== 'realizado' &&
        app.estado !== 'cancelado';
    }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    setPastCalendarAppointments(pastAppointments);
    setUpcomingAppointments(futureAppointments);
  }, [appointments, isLoadingAppointments, client.id]);

  const allRealizedSessions = useMemo((): RealizedSessionView[] => {
    const manualSessionsView: RealizedSessionView[] = sessions.map(s => ({
      ...s,
      isFromCalendar: false,
      sessionType: s.type || 'Sessão Manual',
      duration: s.duracao,
      arquivos: processSessionFiles(s.arquivos),
    }));

    const pastCalendarSessionsView: RealizedSessionView[] = pastCalendarAppointments.map(app => {
      const existingManualSession = sessions.find(s => s.id === app.id.toString());
      const sessionNote = existingManualSession?.notes || app.notas || '';

      const appDate = parseISO(app.data);
      const formattedTime = app.hora || (isValid(appDate) ? format(appDate, 'HH:mm') : '');

      const storedFiles = (sessionFilesMap[app.id.toString()] || []).map(file => ({ ...file }));
      const arquivos = mergeSessionFiles(processSessionFiles(existingManualSession?.arquivos || []), storedFiles);

      if (existingManualSession) {
        return {
          ...existingManualSession,
          isFromCalendar: true,
          calendarTitle: app.titulo,
          status: app.estado,
          sessionType: app.tipo ?? undefined,
          notes: sessionNote,
          terapeuta: app.terapeuta ?? existingManualSession.terapeuta,
          arquivos,
          time: formattedTime,
        };
      }

      return {
        id: app.id?.toString() || '',
        clientId: app.id_cliente?.toString() || clientId,
        date: app.data || '',
        notes: sessionNote,
        paid: false,
        terapeuta: app.terapeuta ?? '',
        arquivos,
        isFromCalendar: true,
        calendarTitle: app.titulo || '',
        status: app.estado || '',
        sessionType: app.tipo || '',
        time: formattedTime,
      };
    });

    const combined = [...manualSessionsView, ...pastCalendarSessionsView];

    const uniqueSessions = combined.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.id === current.id);

      if (existingIndex === -1) {
        return [...acc, current];
      }

      const existing = acc[existingIndex];
      if (
        (current.isFromCalendar && current.status === 'realizado') ||
        (existing.isFromCalendar === false && current.isFromCalendar)
      ) {
        return acc.map((s, i) =>
          i === existingIndex
            ? {
                ...s,
                ...current,
                arquivos: mergeSessionFiles(existing.arquivos, current.arquivos),
                notes: existing.notes || current.notes,
              }
            : s
        );
      }

      return acc;
    }, [] as RealizedSessionView[]);

    const getTimestamp = (session: RealizedSessionView): number => {
      const parsed = parseISO(session.date);
      return isValid(parsed) ? parsed.getTime() : 0;
    };

    return uniqueSessions.sort((a, b) =>
      sortOrder === 'desc' ? getTimestamp(b) - getTimestamp(a) : getTimestamp(a) - getTimestamp(b)
    );
  }, [sessions, pastCalendarAppointments, sortOrder, clientId, sessionFilesMap]);

  const filteredSessions = useMemo(() => {
    return allRealizedSessions.filter(session => {
      if (filterType !== 'all' && session.sessionType?.toLowerCase() !== filterType.toLowerCase()) {
        return false;
      }

      if (filterStatus !== 'all') {
        if (filterStatus === 'realizado' && session.status !== 'realizado') {
          return false;
        }
        if (filterStatus === 'nao_realizado' && session.status === 'realizado') {
          return false;
        }
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesType = session.sessionType?.toLowerCase().includes(searchLower);
        const matchesNotes = session.notes?.toLowerCase().includes(searchLower);
        const matchesTherapist = session.terapeuta?.toLowerCase().includes(searchLower);
        const matchesCalendarTitle = session.calendarTitle?.toLowerCase().includes(searchLower);

        return Boolean(matchesType || matchesNotes || matchesTherapist || matchesCalendarTitle);
      }

      return true;
    });
  }, [allRealizedSessions, filterType, searchText, filterStatus]);

  const realizedCount = useMemo(
    () => allRealizedSessions.filter(s => s.status === 'realizado').length,
    [allRealizedSessions]
  );

  const summarySessions = useMemo(
    () =>
      filteredSessions.map(session => ({
        date: session.date,
        notes: session.notes,
        status: session.status,
      })),
    [filteredSessions]
  );
  const cancelledCount = useMemo(
    () => allRealizedSessions.filter(s => s.status === 'cancelado').length,
    [allRealizedSessions]
  );

  const maxSessions = client.max_sessoes ?? 0;
  const progressCount = paidSessionsCount !== undefined ? paidSessionsCount : realizedCount;
  const completedSessionsPercentage = maxSessions > 0
    ? Math.min(100, (progressCount / maxSessions) * 100)
    : 0;

  useEffect(() => {
    if (
      syncProgress &&
      client.numero_sessoes !== realizedCount &&
      lastUpdatedValueRef.current !== realizedCount
    ) {
      lastUpdatedValueRef.current = realizedCount;
      onUpdateClient({
        ...client,
        numero_sessoes: realizedCount,
      });
    }
  }, [realizedCount, syncProgress, client, onUpdateClient]);

  const refreshData = () => {
    onRefetchAppointments();
    toast.success('Dados atualizados a partir do servidor');
  };

  const syncSessionCount = () => {
    if (client.numero_sessoes !== realizedCount) {
      onUpdateClient({
        ...client,
        numero_sessoes: realizedCount,
      });
      lastUpdatedValueRef.current = realizedCount;
      toast.success('Contagem de sessões sincronizada com sucesso');
    } else {
      toast.info('A contagem de sessões já está sincronizada');
    }
  };

  const handleSetMaxSessions = (data: { maxSessions: number }) => {
    const value = Number.isNaN(data.maxSessions) ? 0 : Math.max(0, data.maxSessions);
    onUpdateClient({ ...client, max_sessoes: value });
    setIsMaxSessionsDialogOpen(false);
    toast.success('Número máximo de sessões definido com sucesso');
  };

  const handleCompleteProcess = () => {
    onUpdateClient({ ...client, estado: 'finished' });
    setIsCompleteDialogOpen(false);
    toast.success('Processo concluído com sucesso');
    navigate('/clients');
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete) return;
    onDeleteSession(sessionToDelete.id);
    setSessionToDelete(null);
  };

  const getSessionTypeOptions = (): string[] => {
    const uniqueTypes = new Set<string>();
    allRealizedSessions.forEach(session => {
      if (session.sessionType) {
        uniqueTypes.add(session.sessionType.toLowerCase());
      }
    });
    return Array.from(uniqueTypes).sort();
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const viewSessionNotes = (session: RealizedSessionView) => {
    const notes = session.notes || 'Sem notas disponíveis para esta sessão.';
    toast.info(
      <div className="max-w-md">
        <h3 className="font-bold mb-2">Notas da Sessão</h3>
        {session.terapeuta && (
          <p className="text-sm mb-2"><strong>Terapeuta:</strong> {session.terapeuta}</p>
        )}
        <p className="whitespace-pre-wrap">{notes}</p>
      </div>,
      {
        duration: 10000,
        className: 'session-notes-toast',
      }
    );
  };

  const hasActiveFilters = Boolean(searchText) || filterType !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setSearchText('');
    setFilterType('all');
    setFilterStatus('all');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Check} label="Realizadas" value={realizedCount} tone="teal" />
        <KpiCard icon={Calendar} label="Agendadas" value={upcomingAppointments.length} tone="blue" />
        <KpiCard icon={AlertCircle} label="Canceladas" value={cancelledCount} tone="red" />
      </div>

      {maxSessions > 0 && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h4 className="text-sm font-medium">Progresso das Sessões</h4>
                <span className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{progressCount}</strong> de{' '}
                  <strong className="text-foreground">{maxSessions}</strong> sessões pagas
                </span>
              </div>
              <div className="relative w-full">
                <Progress value={completedSessionsPercentage} className="h-3" />
                {Array.from({ length: Math.floor(maxSessions / 5) }).map((_, i) => {
                  const milestone = (i + 1) * 5;
                  if (milestone < maxSessions) {
                    const leftPosition = (milestone / maxSessions) * 100;
                    return (
                      <div
                        key={milestone}
                        className="absolute top-0 h-full w-0.5 bg-muted-foreground/30"
                        style={{ left: `${leftPosition}%` }}
                        title={`Meta de ${milestone} sessões`}
                      />
                    );
                  }
                  return null;
                })}
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-muted-foreground">
                <span>{Math.round(completedSessionsPercentage)}% concluído</span>
                <span>{Math.max(0, maxSessions - progressCount)} sessões restantes</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={syncSessionCount} className="text-xs">
                  Sincronizar Contagem
                </Button>
                <div className="flex items-center gap-2">
                  <Switch
                    id="sync-progress"
                    checked={syncProgress}
                    onCheckedChange={setSyncProgress}
                    className="switch-checked"
                  />
                  <Label
                    htmlFor="sync-progress"
                    className="text-xs cursor-pointer flex items-center gap-1"
                  >
                    {syncProgress ? 'Auto-Sincronizar' : 'Manual'}
                    {!syncProgress && <Link2Off className="h-3 w-3" />}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <UpcomingAppointmentsCard appointments={upcomingAppointments} />

      {appointmentsError && !isLoadingAppointments && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
              Não foi possível atualizar os agendamentos a partir do servidor. Os dados apresentados
              podem estar desatualizados.
            </p>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 lg:justify-between lg:items-center">
        <div className="flex gap-2 flex-wrap lg:flex-nowrap lg:flex-1">
          <Input
            placeholder="Procurar nas sessões..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full sm:max-w-xs"
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
                {filterType !== 'all' && <Badge className="ml-2">{getSessionTypeLabel(filterType)}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filtrar por Tipo</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterType('all')}
                    className="w-auto"
                    size="sm"
                  >
                    Todos
                  </Button>

                  {getSessionTypeOptions().map(type => (
                    <Button
                      key={type}
                      variant={filterType === type ? 'default' : 'outline'}
                      onClick={() => setFilterType(type)}
                      className="w-auto"
                      size="sm"
                    >
                      {getSessionTypeLabel(type)}
                    </Button>
                  ))}
                </div>

                <h4 className="font-medium pt-2">Filtrar por Estado</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('all')}
                    className="w-auto"
                    size="sm"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filterStatus === 'realizado' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('realizado')}
                    className="w-auto"
                    size="sm"
                  >
                    Realizadas
                  </Button>
                  <Button
                    variant={filterStatus === 'nao_realizado' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('nao_realizado')}
                    className="w-auto"
                    size="sm"
                  >
                    Não Realizadas
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" className="h-10" onClick={toggleSortOrder}>
            {sortOrder === 'desc' ? (
              <>
                <SortDesc className="h-4 w-4 mr-2" />
                Mais Recentes
              </>
            ) : (
              <>
                <SortAsc className="h-4 w-4 mr-2" />
                Mais Antigos
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" className="h-10" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

          <Button variant="outline" size="sm" className="h-10" onClick={() => setIsSummaryOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar resumo
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isMaxSessionsDialogOpen} onOpenChange={setIsMaxSessionsDialogOpen}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaxSessionsDialogOpen(true)}
              className="h-10"
            >
              <Clock className="h-4 w-4 mr-2" />
              Número de Sessões
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Número Máximo de Sessões</DialogTitle>
                <DialogDescription>
                  Defina o número máximo de sessões para este cliente para acompanhar o progresso.
                </DialogDescription>
              </DialogHeader>
              <Form {...maxSessionsForm}>
                <form onSubmit={maxSessionsForm.handleSubmit(handleSetMaxSessions)} className="space-y-4">
                  <FormField
                    control={maxSessionsForm.control}
                    name="maxSessions"
                    rules={{ min: { value: 0, message: 'O valor não pode ser negativo' } }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número Máximo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setIsCompleteDialogOpen(true)}
            >
              <Check className="h-4 w-4 mr-2" />
              Completar Processo
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Completar Processo do Cliente</DialogTitle>
                <DialogDescription>
                  Confirme a conclusão do processo. Isto irá alterar o estado do cliente para
                  "Finalizado".
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCompleteProcess}>Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="px-6">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </span>
            Histórico de Sessões
            {!isLoadingAppointments && (
              <Badge variant="secondary" className="tabular-nums">{filteredSessions.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingAppointments ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Terapeuta</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatSessionDateTime(session.date, session.time)}
                      </TableCell>
                      <TableCell>
                        {getSessionTypeLabel(session.sessionType)}
                        {session.calendarTitle && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {session.calendarTitle}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{session.terapeuta || 'Não definido'}</TableCell>
                      <TableCell>{formatSessionDuration(session.duration)}</TableCell>
                      <TableCell>
                        <StatusBadge status={session.status} />
                      </TableCell>
                      <TableCell>
                        {session.notes ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewSessionNotes(session)}
                            className="h-8 px-2"
                          >
                            Ver Notas
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem notas</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setSessionToEdit(session)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          {!session.isFromCalendar && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => setSessionToDelete(session)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              icon={<Calendar className="h-10 w-10" />}
              title={hasActiveFilters ? 'Nenhuma sessão encontrada' : 'Sem sessões registadas'}
              description={
                hasActiveFilters
                  ? 'Ajuste ou limpe os filtros para ver mais resultados.'
                  : 'As sessões deste cliente serão apresentadas aqui assim que existirem agendamentos ou registos.'
              }
              action={
                hasActiveFilters
                  ? {
                      label: 'Limpar filtros',
                      onClick: clearFilters,
                      icon: <Filter className="h-4 w-4" />,
                      variant: 'outline' as const,
                    }
                  : undefined
              }
            />
          )}
        </CardContent>
      </Card>

      <SessionEditDialog
        session={sessionToEdit}
        clientId={clientId}
        onClose={() => setSessionToEdit(null)}
        onSaved={() => {
          setSessionFilesMap(loadSessionFilesMap());
          onRefetchAppointments();
        }}
        onUpdateManualSession={onUpdateSession}
      />

      <SessionSummaryDialog
        open={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        clientName={client.nome || ''}
        sessions={summarySessions}
        moods={isSummaryOpen ? readClientMoods(client.id) : []}
        onSave={(summaryText) => {
          onUpdateClient({
            ...client,
            notas: client.notas ? `${client.notas}\n\n${summaryText}` : summaryText,
          });
          toast.success('Resumo guardado nas notas do cliente');
          setIsSummaryOpen(false);
        }}
      />

      <ConfirmDialog
        open={sessionToDelete !== null}
        onOpenChange={(open) => !open && setSessionToDelete(null)}
        onConfirm={confirmDeleteSession}
        title="Eliminar Sessão"
        description="Tem a certeza que quer eliminar esta sessão? Esta ação não pode ser revertida."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
};

export default ClientSessions;
