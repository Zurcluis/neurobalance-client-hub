import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Euro,
  Calendar,
  TrendingUp,
  Receipt,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import KpiCard from '@/components/shared/KpiCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { parseLocalISO } from '@/utils/dateUtils';
import { CHART, tooltipStyle, axisProps } from '@/utils/chartUtils';
import type { ClientPayment } from '@/types/client-dashboard';

interface ClientPaymentsProps {
  clientId: number;
}

type Payment = ClientPayment;

type Period = 'month' | 'year' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  month: 'Neste mês',
  year: 'Neste ano',
  all: 'Total geral'
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  multibanco: 'Multibanco',
  mbway: 'MB WAY',
  transferencia: 'Transferência',
  'transferência': 'Transferência',
  dinheiro: 'Dinheiro',
  numerario: 'Numerário',
  cartao: 'Cartão',
  'cartão': 'Cartão'
};

const getPaymentTypeLabel = (type: string) => {
  return PAYMENT_TYPE_LABELS[type.toLowerCase()] || type;
};

const getPaymentTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'multibanco': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
    case 'mbway': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'transferencia':
    case 'transferência': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300';
    case 'dinheiro':
    case 'numerario': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
    case 'cartao':
    case 'cartão': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300';
    default: return 'bg-muted text-foreground';
  }
};

const PIE_COLORS = [CHART.primary, CHART.soft, CHART.green, CHART.red];

const ClientPayments: React.FC<ClientPaymentsProps> = ({ clientId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('id_cliente', clientId)
        .order('data', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setPayments(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    const now = new Date();

    switch (selectedPeriod) {
      case 'month':
        return payments.filter(payment => {
          const paymentDate = parseLocalISO(payment.data);
          return paymentDate >= startOfMonth(now) && paymentDate <= endOfMonth(now);
        });
      case 'year':
        return payments.filter(payment => {
          const paymentDate = parseLocalISO(payment.data);
          return paymentDate >= startOfYear(now) && paymentDate <= endOfYear(now);
        });
      default:
        return payments;
    }
  }, [payments, selectedPeriod]);

  const stats = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.valor, 0);
    const averageAmount = filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0;

    return {
      totalAmount,
      averageAmount,
      totalPayments: filteredPayments.length,
      lastPayment: filteredPayments[0]
    };
  }, [filteredPayments]);

  const paymentMethodData = useMemo(() => {
    const methodCounts = filteredPayments.reduce((acc, payment) => {
      acc[payment.tipo] = (acc[payment.tipo] || 0) + payment.valor;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([method, amount]) => ({
      name: getPaymentTypeLabel(method),
      value: amount
    }));
  }, [filteredPayments]);

  const monthlyData = useMemo(() => {
    const byMonth = new Map<string, number>();

    payments.forEach(payment => {
      const key = format(parseLocalISO(payment.data), 'yyyy-MM');
      byMonth.set(key, (byMonth.get(key) || 0) + payment.valor);
    });

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, amount]) => ({
        month: format(parseLocalISO(`${key}-01`), 'MMM yyyy', { locale: pt }),
        amount
      }));
  }, [payments]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => fetchPayments()} className="h-8">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Consulte os seus pagamentos e o histórico financeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por período">
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('month')}
              size="sm"
            >
              Este Mês
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('year')}
              size="sm"
            >
              Este Ano
            </Button>
            <Button
              variant={selectedPeriod === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod('all')}
              size="sm"
            >
              Todos
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <KpiCard
          icon={Euro}
          label="Total Pago"
          value={`€${stats.totalAmount.toFixed(2)}`}
          sub={PERIOD_LABELS[selectedPeriod]}
          tone="emerald"
        />
        <KpiCard
          icon={Receipt}
          label="Pagamentos"
          value={stats.totalPayments}
          sub="Número de transações"
          tone="teal"
        />
        <KpiCard
          icon={TrendingUp}
          label="Valor Médio"
          value={`€${stats.averageAmount.toFixed(2)}`}
          sub="Por pagamento"
          tone="blue"
        />
        <KpiCard
          icon={Clock}
          label="Último Pagamento"
          value={stats.lastPayment
            ? format(parseLocalISO(stats.lastPayment.data), 'd MMM', { locale: pt })
            : '—'}
          sub={stats.lastPayment ? `€${stats.lastPayment.valor.toFixed(2)}` : 'Sem pagamentos'}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>Pagamentos nos últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Sem dados para apresentar
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Valor']}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke={CHART.primary}
                      strokeWidth={2}
                      dot={{ fill: CHART.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>Distribuição por tipo de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Sem dados para apresentar
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {paymentMethodData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => [`€${Number(value).toFixed(2)}`, String(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-10 w-10" />}
              title="Nenhum pagamento encontrado"
              description={selectedPeriod === 'month'
                ? 'Não existem pagamentos neste mês.'
                : selectedPeriod === 'year'
                  ? 'Não existem pagamentos neste ano.'
                  : 'Não existem pagamentos registados.'}
            />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Descrição</th>
                      <th className="py-3 pr-4 font-medium">Data</th>
                      <th className="py-3 pr-4 font-medium">Tipo</th>
                      <th className="py-3 font-medium text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-border/60 last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 pr-4 font-medium text-foreground max-w-[240px] truncate">
                          {payment.descricao}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                          {format(parseLocalISO(payment.data), "d 'de' MMMM", { locale: pt })}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge className={getPaymentTypeColor(payment.tipo)} variant="secondary">
                            {getPaymentTypeLabel(payment.tipo)}
                          </Badge>
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                          €{payment.valor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-3 p-4 border border-border rounded-lg bg-card min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{payment.descricao}</h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(parseLocalISO(payment.data), "d 'de' MMMM", { locale: pt })}
                          </span>
                          <Badge className={getPaymentTypeColor(payment.tipo)} variant="secondary">
                            {getPaymentTypeLabel(payment.tipo)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-emerald-600">
                        €{payment.valor.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseLocalISO(payment.criado_em), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p>Todos os pagamentos são processados de forma segura e encriptada</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p>Recibos e faturas são enviados automaticamente por email</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Para questões sobre pagamentos, contacte-nos através do chat ou telefone</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p>Mantenha os seus dados de pagamento sempre atualizados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPayments;
