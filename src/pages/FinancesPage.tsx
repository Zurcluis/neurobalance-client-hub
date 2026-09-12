import { useState, useEffect, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import KpiCard from '@/components/shared/KpiCard';
import FinancialReport from '@/components/finances/FinancialReport';
import ExpenseManager from '@/components/finances/ExpenseManager';
import EmptyFinanceState from '@/components/finances/EmptyFinanceState';
import CashFlowDashboard from '@/components/finances/CashFlowDashboard';
import TaxBreakdown from '@/components/finances/TaxBreakdown';
import MonthlyAnalysis from '@/components/finances/MonthlyAnalysis';
import BalanceSheet from '@/components/finances/BalanceSheet';
import FiscalReports from '@/components/finances/FiscalReports';
import FiscalDeadlines from '@/components/finances/FiscalDeadlines';
import SmartTaxCalculator from '@/components/finances/SmartTaxCalculator';
import FinancialChatbot from '@/components/finances/FinancialChatbot';
import LoanTracker from '@/components/finances/LoanTracker';
import ForecastAndAlertsTab from '@/components/finances/ForecastAndAlertsTab';
import PaymentImport, { PaymentImportData } from '@/components/finances/PaymentImport';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useTabSync from '@/hooks/useTabSync';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Calculator,
  FileText,
  Calendar,
  AlertCircle,
  Sparkles,
  Plus,
  DollarSign,
  PiggyBank,
  Upload,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { usePayments } from '@/hooks/usePayments';
import { formatCurrency } from '@/utils/formatUtils';
import { format, differenceInDays, startOfYear, endOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { getUpcomingFiscalDeadlines } from '@/utils/fiscalCalendar';
import {
  FinancePeriod,
  FINANCE_PERIOD_OPTIONS,
  PERIOD_META,
  getPeriodWindow,
  sumInWindow,
  countInWindow,
} from '@/utils/financePeriods';

/** Variação percentual; null quando não há base de comparação. */
const pctChange = (current: number, previous: number): number | null => {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
};

const FinancesPage = () => {
  const [activeTab, setActiveTab] = useTabSync<string>(
    'overview',
    ['overview', 'transactions', 'loans', 'analysis', 'forecast', 'taxes', 'tools']
  );
  const [transactionTab, setTransactionTab] = useState<string>('income');
  const [analysisTab, setAnalysisTab] = useState<string>('monthly');
  const [taxTab, setTaxTab] = useState<string>('breakdown');
  const [showImportModal, setShowImportModal] = useState(false);
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const currentYear = new Date().getFullYear();

  const { expenses, fetchExpenses: refreshExpenses } = useExpenses();
  const { payments: paymentsData, isLoading, error, fetchPayments } = usePayments();

  useEffect(() => {
    document.title = 'Gestão Financeira | NeuroBalance';
  }, []);

  const handleImportPayments = async (importedPayments: PaymentImportData[]) => {
    try {
      const paymentsToInsert = importedPayments.map(p => ({
        id_cliente: p.id_cliente,
        data: p.data,
        valor: p.valor_total,
        descricao: p.descricao,
        tipo: p.metodo_pagamento,
        nif: p.nif_original,
        tipo_servico: p.tipologia,
        numero_fatura: p.numero_fatura,
        valor_base: p.valor_base || 0,
        valor_iva: p.valor_iva || 0,
        retencao: p.retencao || 0,
        estado: p.estado
      }));

      const { error } = await supabase
        .from('pagamentos')
        .insert(paymentsToInsert);

      if (error) throw error;

      toast.success(`${paymentsToInsert.length} pagamentos importados com sucesso!`);
      setShowImportModal(false);
      fetchPayments();
    } catch (err) {
      console.error('Erro ao importar pagamentos:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Falha ao importar pagamentos: ' + message);
    }
  };

  // Métricas do período selecionado com comparação real vs. período equivalente anterior
  const metrics = useMemo(() => {
    const now = new Date();
    const win = getPeriodWindow(period, now);
    const year = format(now, 'yyyy');

    const revThis = sumInWindow(paymentsData, win.start, win.end);
    const expThis = sumInWindow(expenses, win.start, win.end);
    const revPrev = sumInWindow(paymentsData, win.prevStart, win.prevEnd);
    const expPrev = sumInWindow(expenses, win.prevStart, win.prevEnd);

    // Acumulado do ano corrente (fallback quando o período não tem dados)
    const ytdStart = startOfYear(now);
    const ytdEnd = endOfDay(now);
    const revYtd = sumInWindow(paymentsData, ytdStart, ytdEnd);
    const expYtd = sumInWindow(expenses, ytdStart, ytdEnd);
    const revYtdCount = countInWindow(paymentsData, ytdStart, ytdEnd);
    const expYtdCount = countInWindow(expenses, ytdStart, ytdEnd);

    // Total histórico (fallback do período Ano e base do período Tudo)
    const revTotal = paymentsData.reduce((acc, p) => acc + (p.valor || 0), 0);
    const expTotal = expenses.reduce((acc, e) => acc + (e.valor || 0), 0);

    return {
      revThis,
      revDelta: pctChange(revThis, revPrev),
      expThis,
      expDelta: pctChange(expThis, expPrev),
      netThis: revThis - expThis,
      marginThis: revThis > 0 ? ((revThis - expThis) / revThis) * 100 : 0,
      year,
      revYtd,
      expYtd,
      revYtdCount,
      expYtdCount,
      revTotal,
      expTotal,
      revTotalCount: paymentsData.length,
      expTotalCount: expenses.length
    };
  }, [period, paymentsData, expenses]);

  // Prazos fiscais reais (calculados a partir do calendário fiscal de FiscalDeadlines)
  const upcomingDeadlines = useMemo(() => getUpcomingFiscalDeadlines(3), []);
  const deadlinesSoon = upcomingDeadlines.filter(
    d => differenceInDays(d.date, new Date()) <= 60
  );

  const formatDelta = (pct: number | null) => {
    const compare = PERIOD_META[period].compare;
    if (pct === null || !compare) return null;
    return { value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% ${compare}`, positive: pct >= 0 };
  };

  // Sub-texto de fallback quando o período não tem dados:
  // dia/semana/mês → acumulado do ano; ano → total histórico; tudo → nenhum
  const fallbackSub = (periodValue: number, kind: 'rev' | 'exp'): string | undefined => {
    if (periodValue !== 0 || period === 'all') return undefined;
    const ytdTotal = kind === 'rev' ? metrics.revYtd : metrics.expYtd;
    const ytdCount = kind === 'rev' ? metrics.revYtdCount : metrics.expYtdCount;
    const totalCount = kind === 'rev' ? metrics.revTotalCount : metrics.expTotalCount;

    if (period === 'year') {
      return totalCount > 0
        ? `Total histórico: ${formatCurrency(kind === 'rev' ? metrics.revTotal : metrics.expTotal)} (${totalCount} transações)`
        : undefined;
    }
    return ytdCount > 0
      ? `Acumulado ${metrics.year}: ${formatCurrency(ytdTotal)} (${ytdCount} transações)`
      : undefined;
  };

  const goToTab = (tab: string, nested?: string) => {
    if (nested) {
      if (tab === 'taxes') setTaxTab(nested);
      if (tab === 'analysis') setAnalysisTab(nested);
      if (tab === 'transactions') setTransactionTab(nested);
    }
    setActiveTab(tab);
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header com ações rápidas */}
        <PageHeader
          title="Gestão Financeira"
          description="Controlo completo das suas finanças e obrigações fiscais"
          icon={<DollarSign className="h-5 w-5" />}
          actions={
            <>
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="h-4 w-4" />
                Importar
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => goToTab('transactions', 'income')}
              >
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </>
          }
        />

        {/* Prazos Fiscais em Destaque (dados reais de FiscalDeadlines) */}
        {deadlinesSoon.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-semibold">Prazos Fiscais Próximos</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground"
                  onClick={() => goToTab('taxes', 'deadlines')}
                >
                  Ver todos
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {deadlinesSoon.map((deadline) => {
                  const daysLeft = differenceInDays(deadline.date, new Date());
                  return (
                    <button
                      key={deadline.title + deadline.date.toISOString()}
                      onClick={() => goToTab('taxes', 'deadlines')}
                      className="group flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
                    >
                      <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
                      <span className="text-sm font-medium">{deadline.title}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {format(deadline.date, "d 'de' MMM", { locale: pt })}
                      </span>
                      <Badge variant={daysLeft <= 14 ? 'destructive' : 'secondary'} className="text-[10px] px-1.5">
                        {daysLeft === 0 ? 'hoje' : `${daysLeft} dias`}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 h-auto md:h-10">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Transações</span>
            </TabsTrigger>
            <TabsTrigger value="loans" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              <span className="hidden sm:inline">Empréstimos</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Análises</span>
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Previsões &amp; Alertas</span>
            </TabsTrigger>
            <TabsTrigger value="taxes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Impostos</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2 relative">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Ferramentas</span>
              <Badge className="absolute -top-1 -right-1 h-4 px-1 text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                NOVO
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Seletor de período */}
            <Tabs value={period} onValueChange={v => setPeriod(v as FinancePeriod)}>
              <TabsList className="grid w-full grid-cols-5 h-9">
                {FINANCE_PERIOD_OPTIONS.map(opt => (
                  <TabsTrigger key={opt.value} value={opt.value} className="px-1 text-xs sm:text-sm">
                    {opt.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-[110px] w-full" />
                <Skeleton className="h-[110px] w-full" />
                <Skeleton className="h-[110px] w-full" />
                <Skeleton className="h-[110px] w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  icon={ArrowDownCircle}
                  label={`Receitas ${PERIOD_META[period].range}`}
                  value={formatCurrency(metrics.revThis)}
                  delta={formatDelta(metrics.revDelta) ?? undefined}
                  tone="emerald"
                  sub={fallbackSub(metrics.revThis, 'rev')}
                />
                <KpiCard
                  icon={ArrowUpCircle}
                  label={`Despesas ${PERIOD_META[period].range}`}
                  value={formatCurrency(metrics.expThis)}
                  delta={metrics.expDelta === null ? undefined : {
                    value: `${metrics.expDelta >= 0 ? '+' : ''}${metrics.expDelta.toFixed(1)}% ${PERIOD_META[period].compare ?? ''}`.trim(),
                    positive: metrics.expDelta <= 0
                  }}
                  tone="red"
                  sub={fallbackSub(metrics.expThis, 'exp')}
                />
                <KpiCard
                  icon={DollarSign}
                  label={`Lucro líquido ${PERIOD_META[period].netRange}`}
                  value={formatCurrency(metrics.netThis)}
                  delta={metrics.revThis > 0 ? { value: `Margem: ${metrics.marginThis.toFixed(1)}%`, positive: metrics.netThis >= 0 } : undefined}
                  tone="blue"
                  sub={
                    metrics.revThis === 0 && metrics.expThis === 0 && (metrics.revYtdCount > 0 || metrics.expYtdCount > 0) && period !== 'all' && period !== 'year'
                      ? `Acumulado ${metrics.year}: ${formatCurrency(metrics.revYtd - metrics.expYtd)}`
                      : undefined
                  }
                />
                <KpiCard
                  icon={Calendar}
                  label="Prazos fiscais"
                  value={deadlinesSoon.length}
                  tone="amber"
                  sub="Próximos 60 dias"
                />
              </div>
            )}

            <CashFlowDashboard payments={paymentsData} expenses={expenses} period={period} />
          </TabsContent>

          {/* Transações */}
          <TabsContent value="transactions" className="space-y-6 mt-6">
            <Tabs value={transactionTab} onValueChange={setTransactionTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="income" className="gap-2">
                  <ArrowDownCircle className="h-4 w-4" />
                  Receitas
                </TabsTrigger>
                <TabsTrigger value="expenses" className="gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  Despesas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="mt-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-red-500 font-medium mb-2">Erro ao carregar dados financeiros</p>
                    <p className="text-muted-foreground mb-4">{error.message}</p>
                    <Button onClick={fetchPayments} variant="outline">
                      Tentar novamente
                    </Button>
                  </div>
                ) : paymentsData.length === 0 ? (
                  <EmptyFinanceState />
                ) : (
                  <FinancialReport initialPayments={paymentsData} />
                )}
              </TabsContent>

              <TabsContent value="expenses" className="mt-4">
                <ExpenseManager onExpenseChange={refreshExpenses} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Empréstimos */}
          <TabsContent value="loans" className="space-y-6 mt-6">
            <LoanTracker expenses={expenses} />
          </TabsContent>

          {/* Análises */}
          <TabsContent value="analysis" className="space-y-6 mt-6">
            <Tabs value={analysisTab} onValueChange={setAnalysisTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="monthly" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Análise Mensal
                </TabsTrigger>
                <TabsTrigger value="balance" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Balanço Geral
                </TabsTrigger>
              </TabsList>

              <TabsContent value="monthly" className="mt-4">
                <MonthlyAnalysis payments={paymentsData} expenses={expenses} />
              </TabsContent>

              <TabsContent value="balance" className="mt-4">
                <BalanceSheet payments={paymentsData} expenses={expenses} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Previsões & Alertas */}
          <TabsContent value="forecast" className="mt-6">
            <ForecastAndAlertsTab
              payments={paymentsData}
              expenses={expenses}
              isLoading={isLoading}
              error={error}
              onRetry={fetchPayments}
            />
          </TabsContent>

          {/* Impostos e Relatórios */}
          <TabsContent value="taxes" className="space-y-6 mt-6">
            <Tabs value={taxTab} onValueChange={setTaxTab} className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="breakdown" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Impostos
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Relatórios Fiscais
                </TabsTrigger>
                <TabsTrigger value="deadlines" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Prazos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="breakdown" className="mt-4">
                <TaxBreakdown payments={paymentsData} expenses={expenses} year={currentYear} />
              </TabsContent>

              <TabsContent value="reports" className="mt-4">
                <FiscalReports payments={paymentsData} expenses={expenses} />
              </TabsContent>

              <TabsContent value="deadlines" className="mt-4">
                <FiscalDeadlines year={currentYear} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Ferramentas */}
          <TabsContent value="tools" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-semibold">Calculadora Inteligente de Impostos</CardTitle>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                      NOVO
                    </Badge>
                  </div>
                  <CardDescription>
                    Calcule IVA, IRS e Segurança Social de forma automática e precisa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SmartTaxCalculator />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chatbot Financeiro - Disponível em todas as abas */}
      <FinancialChatbot />

      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <PaymentImport
            onImportComplete={handleImportPayments}
            onCancel={() => setShowImportModal(false)}
          />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default FinancesPage;
