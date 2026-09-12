import { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import KpiCard from '@/components/shared/KpiCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useTabSync from '@/hooks/useTabSync';
import TeamActivitySection from '@/components/monitoring/TeamActivitySection';
import ClientRiskSection from '@/components/insights/ClientRiskSection';
import {
  Activity,
  KeyRound,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  Info,
  User,
  Users,
  CalendarClock,
  Key,
  HeartPulse,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isBefore, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';

interface TokenActivity {
  id: number;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  source: 'Cliente' | 'Administrador';
  nome: string;
  email: string;
}

const ACTIVITY_LIMIT = 50;

const formatDateTime = (value: string) =>
  format(parseISO(value), 'dd/MM/yyyy HH:mm', { locale: pt });

const maskToken = (token: string) =>
  token.length <= 8 ? '••••••••' : `${token.slice(0, 4)}••••••••${token.slice(-4)}`;

const getTokenStatus = (token: TokenActivity): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
  if (!token.is_active) return { label: 'Revogado', variant: 'destructive' };
  if (isBefore(parseISO(token.expires_at), new Date())) return { label: 'Expirado', variant: 'secondary' };
  return { label: 'Ativo', variant: 'default' };
};

const MonitoringPage = () => {
  const [activities, setActivities] = useState<TokenActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useTabSync<string>('acessos', ['acessos', 'equipa', 'risco']);

  useEffect(() => {
    document.title = 'Monitorização | NeuroBalance';
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientResult, adminResult] = await Promise.all([
        supabase
          .from('client_access_tokens')
          .select('id, token, expires_at, is_active, created_at, last_used_at, id_cliente')
          .order('created_at', { ascending: false })
          .limit(ACTIVITY_LIMIT),
        supabase
          .from('admin_access_tokens')
          .select('id, token, expires_at, is_active, created_at, admin_id')
          .order('created_at', { ascending: false })
          .limit(ACTIVITY_LIMIT),
      ]);

      if (clientResult.error) throw clientResult.error;
      if (adminResult.error) throw adminResult.error;

      // Buscar nomes em separado (client_access_tokens não tem FK para clientes)
      const clientIds = [...new Set((clientResult.data || []).map(r => r.id_cliente).filter(id => id != null))];
      const adminIds = [...new Set((adminResult.data || []).map(r => r.admin_id).filter(id => id != null))];

      const [clientsResult, adminsResult] = await Promise.all([
        clientIds.length
          ? supabase.from('clientes').select('id, nome, email').in('id', clientIds)
          : Promise.resolve({ data: [], error: null }),
        adminIds.length
          ? supabase.from('admins').select('id, nome, email').in('id', adminIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (adminsResult.error) throw adminsResult.error;

      const clientNameById = new Map((clientsResult.data || []).map(c => [c.id, { nome: c.nome, email: c.email }]));
      const adminNameById = new Map((adminsResult.data || []).map(a => [a.id, { nome: a.nome, email: a.email }]));

      const clientTokens: TokenActivity[] = (clientResult.data || []).map((row) => {
        const info = clientNameById.get(row.id_cliente);
        return {
          id: row.id,
          token: row.token,
          expires_at: row.expires_at,
          is_active: row.is_active,
          created_at: row.created_at,
          last_used_at: row.last_used_at,
          source: 'Cliente',
          nome: info?.nome || 'Cliente',
          email: info?.email || '',
        };
      });

      const adminTokens: TokenActivity[] = (adminResult.data || []).map((row) => {
        const info = adminNameById.get(row.admin_id);
        return {
          id: row.id,
          token: row.token,
          expires_at: row.expires_at,
          is_active: row.is_active,
          created_at: row.created_at,
          last_used_at: null,
          source: 'Administrador',
          nome: info?.nome || 'Administrador',
          email: info?.email || '',
        };
      });

      const merged = [...clientTokens, ...adminTokens].sort((a, b) => {
        const keyA = a.last_used_at ?? a.created_at;
        const keyB = b.last_used_at ?? b.created_at;
        return parseISO(keyB).getTime() - parseISO(keyA).getTime();
      });

      setActivities(merged);
    } catch (err) {
      console.error('Erro ao carregar monitorização:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const sevenDaysAgo = subDays(new Date(), 7);

  const clientActiveCount = activities.filter(
    (t) => t.source === 'Cliente' && getTokenStatus(t).label === 'Ativo'
  ).length;

  const adminActiveCount = activities.filter(
    (t) => t.source === 'Administrador' && getTokenStatus(t).label === 'Ativo'
  ).length;

  const recentUseCount = activities.filter(
    (t) => t.last_used_at && !isBefore(parseISO(t.last_used_at), sevenDaysAgo)
  ).length;

  const recentActivity = activities.slice(0, 10);

  return (
    <PageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Monitorização"
          description="Atividade da equipa e acessos via tokens de clientes e administradores"
          icon={<Activity className="h-5 w-5" />}
          actions={
            activeTab === 'acessos' ? (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={fetchActivities}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            ) : undefined
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 md:inline-flex md:w-auto md:h-10">
            <TabsTrigger value="acessos" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Acessos
            </TabsTrigger>
            <TabsTrigger value="equipa" className="gap-2">
              <Users className="h-4 w-4" />
              Atividade da Equipa
            </TabsTrigger>
            <TabsTrigger value="risco" className="gap-2">
              <HeartPulse className="h-4 w-4" />
              Risco &amp; Retenção
            </TabsTrigger>
          </TabsList>

          <TabsContent value="acessos" className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="font-medium text-destructive mb-1">Erro ao carregar dados de monitorização</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchActivities} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Key className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Sem atividade registada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Gere tokens de acesso para começar a acompanhar a atividade
            </p>
            <Button asChild variant="outline" className="mt-4 gap-2">
              <Link to="/client/tokens">
                <KeyRound className="h-4 w-4" />
                Gerir tokens de clientes
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
                icon={KeyRound}
                label="Tokens de cliente ativos"
                value={clientActiveCount}
                sub={`Nos últimos ${ACTIVITY_LIMIT} registos`}
                tone="teal"
              />
              <KpiCard
                icon={ShieldCheck}
                label="Tokens de administrador ativos"
                value={adminActiveCount}
                sub={`Nos últimos ${ACTIVITY_LIMIT} registos`}
                tone="blue"
              />
              <KpiCard
                icon={Clock}
                label="Acessos nos últimos 7 dias"
                value={recentUseCount}
                sub="Tokens utilizados"
                tone="amber"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
                <CardDescription>
                  Últimos acessos registados via tokens de cliente e de administrador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentActivity.map((activity) => {
                  const status = getTokenStatus(activity);
                  return (
                    <div
                      key={`${activity.source}-${activity.id}`}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{activity.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">{activity.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
                        <code className="hidden rounded bg-muted/50 px-2 py-0.5 font-mono text-xs text-muted-foreground md:inline">
                          {maskToken(activity.token)}
                        </code>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {activity.last_used_at ? formatDateTime(activity.last_used_at) : 'Nunca utilizado'}
                        </span>
                        <Badge variant="outline">{activity.source}</Badge>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Para consultar o histórico completo de sessões, utilize a aba Sessões no perfil de
                cada cliente.
              </AlertDescription>
            </Alert>
          </>
        )}
          </TabsContent>

          <TabsContent value="equipa">
            <TeamActivitySection />
          </TabsContent>

          <TabsContent value="risco">
            <ClientRiskSection />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default MonitoringPage;
