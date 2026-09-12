import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import useAppointments from '@/hooks/useAppointments';
import usePayments from '@/hooks/usePayments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import KpiCard from '@/components/shared/KpiCard';
import { EmptyState } from '@/components/shared/EmptyState';
import RiskBadge from './RiskBadge';
import MoodSessionChart from './MoodSessionChart';
import InactiveClientsCard from './InactiveClientsCard';
import WinBackMessageDialog from './WinBackMessageDialog';
import {
  computeAllRisks,
  computeMoodSessionCorrelation,
  RISK_BAND_LABEL,
} from '@/utils/clientInsights';
import type { ClientRisk, InsightMood } from '@/utils/clientInsights';
import {
  Activity,
  AlertTriangle,
  Gauge,
  HeartPulse,
  MessageSquare,
  ArrowUpDown,
  UserX,
} from 'lucide-react';

type SortKey = 'score' | 'nome';
type SortDir = 'asc' | 'desc';

interface MoodQueryResult {
  data: InsightMood[] | null;
  error: { message: string } | null;
}

type MoodQuery = {
  select: (columns: string) => PromiseLike<MoodQueryResult>;
};

const fetchMoods = (table: string): MoodQuery =>
  (supabase.from as unknown as (relation: string) => MoodQuery)(table);

const ClientRiskSection = () => {
  const { clients, isLoading: isLoadingClients } = useClients();
  const { appointments, isLoading: isLoadingAppointments } = useAppointments();
  const { payments, isLoading: isLoadingPayments } = usePayments();
  const [moods, setMoods] = useState<InsightMood[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [messageClient, setMessageClient] = useState<{ name: string; days: number | null } | null>(
    null
  );

  useEffect(() => {
    let active = true;
    fetchMoods('humor_cliente')
      .select('id_cliente, humor, data')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn('Falha ao carregar registos de humor:', error.message);
          return;
        }
        setMoods(data ?? []);
      });
    return () => {
      active = false;
    };
  }, []);

  const risks = useMemo(
    () =>
      computeAllRisks({
        clients,
        appointments,
        payments,
        moods,
      }),
    [clients, appointments, payments, moods]
  );

  const sortedRisks = useMemo(() => {
    const copy = [...risks];
    copy.sort((a, b) => {
      if (sortKey === 'nome') {
        return sortDir === 'asc'
          ? a.nome.localeCompare(b.nome, 'pt')
          : b.nome.localeCompare(a.nome, 'pt');
      }
      return sortDir === 'asc' ? a.score - b.score : b.score - a.score;
    });
    return copy;
  }, [risks, sortKey, sortDir]);

  const inRisk = risks.filter((r) => r.band === 'risco').length;
  const inAttention = risks.filter((r) => r.band === 'atencao').length;
  const averageScore = risks.length
    ? Math.round(risks.reduce((sum, r) => sum + r.score, 0) / risks.length)
    : 0;

  const globalCorrelation = useMemo(
    () => computeMoodSessionCorrelation(moods, appointments, undefined),
    [moods, appointments]
  );

  const selectedRisk = risks.find((r) => r.clientId === selectedClientId) ?? null;
  const selectedCorrelation = useMemo(
    () =>
      selectedClientId !== null
        ? computeMoodSessionCorrelation(moods, appointments, selectedClientId)
        : null,
    [moods, appointments, selectedClientId]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'score' ? 'desc' : 'asc');
    }
  };

  const isLoading = isLoadingClients || isLoadingAppointments || isLoadingPayments;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (risks.length === 0) {
    return (
      <EmptyState
        icon={<HeartPulse className="h-8 w-8" />}
        title="Sem dados suficientes"
        description="Ainda não existem sessões, pagamentos ou registos de humor suficientes para calcular o score de risco de churn."
      />
    );
  }

  const renderRiskRow = (risk: ClientRisk) => {
    const topFactor = [...risk.factors]
      .filter((f) => f.points > 0)
      .sort((a, b) => b.points - a.points)[0];
    return (
      <div
        key={risk.clientId}
        className="flex flex-col gap-3 rounded-lg border p-3 md:hidden"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="min-w-0 truncate text-left text-sm font-medium hover:underline"
            onClick={() => setSelectedClientId(risk.clientId)}
          >
            {risk.nome}
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-bold tabular-nums">{risk.score}</span>
            <RiskBadge band={risk.band} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {topFactor ? `${topFactor.label}: ${topFactor.detail}` : 'Sem fatores de risco relevantes'}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2"
          onClick={() => setSelectedClientId(risk.clientId)}
        >
          Ver detalhe
        </Button>
      </div>
    );
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={AlertTriangle}
          label="Clientes em risco"
          value={inRisk}
          sub="Banda de risco"
          tone="red"
        />
        <KpiCard
          icon={HeartPulse}
          label="Clientes em atenção"
          value={inAttention}
          sub="Banda de atenção"
          tone="amber"
        />
        <KpiCard
          icon={Gauge}
          label="Score médio de risco"
          value={averageScore}
          sub="Escala 0 a 100"
          tone="teal"
        />
        <KpiCard
          icon={UserX}
          label="Clientes avaliados"
          value={risks.length}
          sub={`${clients.length} clientes no total`}
          tone="blue"
        />
      </div>

      <Card className="min-w-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Score de risco de churn</CardTitle>
          <CardDescription>
            Combine faltas recentes, afastamento da cadência, pagamentos e tendência de humor.
            Clique num cliente para ver o detalhe.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 space-y-2">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-medium hover:text-foreground"
                      onClick={() => handleSort('nome')}
                    >
                      Cliente
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-medium hover:text-foreground"
                      onClick={() => handleSort('score')}
                    >
                      Score
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Fator principal</TableHead>
                  <TableHead className="hidden lg:table-cell">Última sessão</TableHead>
                  <TableHead className="text-right">Detalhe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRisks.map((risk) => {
                  const topFactor = [...risk.factors]
                    .filter((f) => f.points > 0)
                    .sort((a, b) => b.points - a.points)[0];
                  return (
                    <TableRow
                      key={risk.clientId}
                      className={selectedClientId === risk.clientId ? 'bg-muted/50' : undefined}
                    >
                      <TableCell className="max-w-[16rem] truncate font-medium">
                        {risk.nome}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="w-8 text-sm font-bold tabular-nums">{risk.score}</span>
                          <Badge variant="outline">{RISK_BAND_LABEL[risk.band]}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[18rem] truncate text-muted-foreground lg:table-cell">
                        {topFactor
                          ? `${topFactor.label}: ${topFactor.detail}`
                          : 'Sem fatores relevantes'}
                      </TableCell>
                      <TableCell className="hidden tabular-nums text-muted-foreground lg:table-cell">
                        {risk.daysSinceLastSession !== null
                          ? `há ${risk.daysSinceLastSession} dias`
                          : 'sem sessões'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedClientId(risk.clientId)}
                        >
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 md:hidden">{sortedRisks.map(renderRiskRow)}</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              {selectedRisk ? selectedRisk.nome : 'Detalhe por cliente'}
            </CardTitle>
            <CardDescription>
              {selectedRisk
                ? 'Fatores que compõem o score de risco deste cliente'
                : 'Selecione um cliente na tabela para ver o detalhe'}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            {selectedRisk ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold tabular-nums">{selectedRisk.score}</span>
                    <RiskBadge band={selectedRisk.band} />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      setMessageClient({
                        name: selectedRisk.nome,
                        days: selectedRisk.daysSinceLastSession,
                      })
                    }
                  >
                    <MessageSquare className="h-4 w-4" />
                    Preparar mensagem
                  </Button>
                </div>
                <div className="space-y-3">
                  {selectedRisk.factors.map((factor) => (
                    <div key={factor.key} className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">{factor.label}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {factor.points}/{factor.maxPoints}
                        </span>
                      </div>
                      <Progress
                        value={(factor.points / factor.maxPoints) * 100}
                        className="mt-1 h-2"
                        aria-label={factor.label}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{factor.detail}</p>
                    </div>
                  ))}
                </div>
                {selectedCorrelation && (
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Activity className="h-4 w-4" />
                      Humor antes e depois das sessões
                    </p>
                    <MoodSessionChart correlation={selectedCorrelation} />
                  </div>
                )}
              </>
            ) : (
              <MoodSessionChart correlation={globalCorrelation} />
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Humor × Sessões (global)</CardTitle>
            <CardDescription>
              Média de humor nos 7 dias anteriores e posteriores a cada sessão, agregada por número
              de sessão
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <MoodSessionChart correlation={globalCorrelation} />
            <p className="mt-3 text-xs text-muted-foreground">
              Antes: média {globalCorrelation.avgBefore !== null ? globalCorrelation.avgBefore.toFixed(1) : 'sem dados'} ·
              Depois: média{' '}
              {globalCorrelation.avgAfter !== null ? globalCorrelation.avgAfter.toFixed(1) : 'sem dados'}
            </p>
          </CardContent>
        </Card>
      </div>

      <InactiveClientsCard clients={clients} appointments={appointments} />

      <WinBackMessageDialog
        open={messageClient !== null}
        onOpenChange={(open) => {
          if (!open) setMessageClient(null);
        }}
        clientName={messageClient?.name ?? ''}
        daysInactive={messageClient?.days ?? null}
      />
    </div>
  );
};

export default ClientRiskSection;
