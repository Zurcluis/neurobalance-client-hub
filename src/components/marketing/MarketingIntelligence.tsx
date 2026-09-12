import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import KpiCard from '@/components/shared/KpiCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Users, TrendingUp, Euro, Target } from 'lucide-react';
import { supabase, supabaseAnon } from '@/integrations/supabase/client';
import {
  computeCampaignAttribution,
  InsightClient,
  InsightPayment,
} from '@/utils/marketingInsights';
import { formatCurrency } from '@/utils/formatUtils';
import { CHART, tooltipStyle, axisProps, compactCurrency } from '@/utils/chartUtils';
import { LandingLead } from '@/types/landing-lead';
import { LeadCompra } from '@/types/lead-compra';
import { MarketingCampaign } from '@/types/marketing';
import { EmailSmsCampaign } from '@/types/email-sms-campaign';
import ColdLeadsFollowUp from './ColdLeadsFollowUp';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

interface MarketingIntelligenceProps {
  landingLeads: LandingLead[];
  registros: LeadCompra[];
  campaigns: MarketingCampaign[];
  emailCampaigns: EmailSmsCampaign[];
  isLoading: boolean;
}

const isRlsError = (err: unknown) => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string };
  return e.code === '42501' || (typeof e.message === 'string' && (
    e.message.toLowerCase().includes('row-level security') ||
    e.message.toLowerCase().includes('permission denied')
  ));
};

const MarketingIntelligence = ({
  landingLeads,
  registros,
  campaigns,
  emailCampaigns,
  isLoading,
}: MarketingIntelligenceProps) => {
  const [clients, setClients] = useState<InsightClient[]>([]);
  const [payments, setPayments] = useState<InsightPayment[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoadingClients(true);
      try {
        let clientsData: InsightClient[] = [];
        let paymentsData: InsightPayment[] = [];

        let res = await supabase
          .from('clientes')
          .select('id, nome, email, telefone, estado, total_pago');
        if (isRlsError(res.error)) {
          res = await supabaseAnon
            .from('clientes')
            .select('id, nome, email, telefone, estado, total_pago');
        }
        clientsData = (res.data || []) as InsightClient[];

        let payRes = await supabase.from('pagamentos').select('id_cliente, valor');
        if (isRlsError(payRes.error)) {
          payRes = await supabaseAnon.from('pagamentos').select('id_cliente, valor');
        }
        paymentsData = (payRes.data || []) as InsightPayment[];

        if (active) {
          setClients(clientsData);
          setPayments(paymentsData);
        }
      } catch (err) {
        console.error('Erro ao carregar clientes e pagamentos para atribuição:', err);
      } finally {
        if (active) setIsLoadingClients(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const attribution = useMemo(
    () =>
      computeCampaignAttribution({
        landingLeads,
        registros,
        clients,
        payments,
        campaigns,
      }),
    [landingLeads, registros, clients, payments, campaigns]
  );

  const chartData = useMemo(
    () =>
      attribution.rows
        .slice()
        .sort((a, b) => b.revenue - a.revenue || b.leads - a.leads)
        .slice(0, 8)
        .map((row) => ({
          label: row.label.length > 14 ? `${row.label.slice(0, 13)}…` : row.label,
          receita: Math.round(row.revenue),
          custo: Math.round(row.cost),
        })),
    [attribution]
  );

  const isLoadingAll = isLoading || isLoadingClients;

  if (isLoadingAll) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Leads únicos"
          value={attribution.totals.leads}
          sub="Landing + registos, sem duplicados"
          tone="blue"
        />
        <KpiCard
          icon={Target}
          label="Taxa de conversão"
          value={`${attribution.totals.conversionRate.toFixed(1)}%`}
          sub={`${attribution.totals.conversions} leads convertidos`}
          tone="teal"
        />
        <KpiCard
          icon={Euro}
          label="Receita atribuída (LTV)"
          value={formatCurrency(attribution.totals.revenue)}
          sub="Pagamentos somados por cliente"
          tone="emerald"
        />
        <KpiCard
          icon={TrendingUp}
          label="ROAS global"
          value={attribution.totals.roas !== null ? `${attribution.totals.roas.toFixed(1)}x` : '—'}
          sub={`Custo total: ${formatCurrency(attribution.totals.cost)}`}
          tone="purple"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atribuição lead → cliente → LTV</CardTitle>
          <CardDescription>
            Cruza leads, clientes e pagamentos por campanha. Receita = LTV somado dos clientes
            originados em cada campanha. Acumulado desde o início.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {attribution.rows.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="Sem leads para atribuir"
              description="Assim que existirem leads ou campanhas registados, verá aqui a conversão, a receita e o ROAS por campanha."
            />
          ) : (
            <>
              {chartData.length > 0 && (
                <div className="h-64 sm:h-72 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" {...axisProps} minTickGap={12} />
                      <YAxis {...axisProps} width={48} tickFormatter={compactCurrency} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="receita" name="Receita (LTV)" fill={CHART.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="custo" name="Custo" fill={CHART.red} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Campanha</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Conversões</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Receita (LTV)</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attribution.rows.map((row) => (
                      <TableRow key={row.key} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.leads}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.conversions}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.conversionRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.revenue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.cost)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.roas !== null ? `${row.roas.toFixed(1)}x` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-4 md:hidden">
                {attribution.rows.map((row) => (
                  <Card key={row.key} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{row.label}</p>
                      <Badge variant="outline" className="shrink-0">
                        ROAS {row.roas !== null ? `${row.roas.toFixed(1)}x` : '—'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Leads</p>
                        <p className="font-medium tabular-nums">{row.leads}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Conversões</p>
                        <p className="font-medium tabular-nums">
                          {row.conversions} ({row.conversionRate.toFixed(1)}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Receita (LTV)</p>
                        <p className="font-medium tabular-nums">{formatCurrency(row.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Custo</p>
                        <p className="font-medium tabular-nums">{formatCurrency(row.cost)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ColdLeadsFollowUp leads={landingLeads} emailCampaigns={emailCampaigns} isLoading={isLoading} />
    </div>
  );
};

export default MarketingIntelligence;
