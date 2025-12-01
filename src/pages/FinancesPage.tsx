import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Zap,
  PiggyBank
} from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { usePayments } from '@/hooks/usePayments';

const FinancesPage = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [transactionTab, setTransactionTab] = useState<string>('income');
  const [analysisTab, setAnalysisTab] = useState<string>('monthly');
  const [taxTab, setTaxTab] = useState<string>('breakdown');
  const currentYear = new Date().getFullYear();

  const { expenses, isLoading: isLoadingExpenses, fetchExpenses: refreshExpenses } = useExpenses();
  const { payments: paymentsData, isLoading: isLoadingPayments } = usePayments();

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          *,
          clientes:id_cliente (
            nome
          )
        `)
        .order('data', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar pagamentos:', error);
        setError('Falha ao carregar pagamentos');
        toast.error('Erro ao carregar pagamentos');
        return;
      }
      
      if (!data) {
        setPayments([]);
        return;
      }
      
      const formattedPayments = data.map(payment => ({
        ...payment,
        cliente_nome: payment.clientes?.nome || 'Cliente Desconhecido'
      }));
      
      setPayments(formattedPayments);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      setError('Falha ao carregar pagamentos');
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Calcular métricas rápidas
  const totalRevenue = paymentsData.reduce((acc, p) => acc + (p.valor || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.valor || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Próximos prazos fiscais
  const upcomingDeadlines = [
    { name: 'IVA - 1º Trimestre', date: '2025-05-20', daysLeft: 30, priority: 'high' },
    { name: 'IRS - Declaração Anual', date: '2025-06-30', daysLeft: 65, priority: 'medium' },
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header com ações rápidas */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3f9094] to-[#2A5854] bg-clip-text text-transparent">
              Gestão Financeira
            </h1>
            <p className="text-gray-600 mt-1">Controle completo das suas finanças e obrigações fiscais</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90">
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Alertas Fiscais em Destaque */}
        {upcomingDeadlines.length > 0 && (
          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-900">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Prazos Fiscais Próximos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {upcomingDeadlines.map((deadline, index) => (
                  <Badge 
                    key={index} 
                    variant={deadline.priority === 'high' ? 'destructive' : 'secondary'}
                    className="px-3 py-1.5"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {deadline.name} - {deadline.daysLeft} dias
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Principais - Reorganizadas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto md:h-10">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3f9094] data-[state=active]:to-[#2A5854]">
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
          
          {/* 📊 Visão Geral */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Cards de Resumo - Maiores e Mais Visuais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 border-t-4 border-t-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4 text-green-600" />
                    Receitas Totais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    €{totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">+12.5% vs ano anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-gray-900 border-t-4 border-t-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-red-600" />
                    Despesas Totais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    €{totalExpenses.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">-5.2% vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 border-t-4 border-t-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Lucro Líquido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    €{netProfit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">
                      Margem: {profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Dashboard de Fluxo de Caixa */}
            <CashFlowDashboard payments={paymentsData} expenses={expenses} />
          </TabsContent>

          {/* 💰 Transações */}
          <TabsContent value="transactions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Gestão de Transações
                </CardTitle>
                <CardDescription>
                  Adicione e gerencie suas receitas e despesas
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f9094]"></div>
                        <span className="ml-2">Carregando receitas...</span>
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                        <p className="text-red-500 font-medium mb-2">Erro ao carregar dados financeiros</p>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={fetchPayments} variant="outline">
                          Tentar Novamente
                        </Button>
                      </div>
                    ) : payments.length === 0 ? (
                      <EmptyFinanceState />
                    ) : (
                      <FinancialReport initialPayments={payments} />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="expenses" className="mt-4">
                    <ExpenseManager onExpenseChange={refreshExpenses} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 🏦 Empréstimos */}
          <TabsContent value="loans" className="space-y-6 mt-6">
            <LoanTracker expenses={expenses} />
          </TabsContent>

          {/* 📊 Análises */}
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

          {/* 🧾 Impostos e Relatórios */}
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

          {/* 🧮 Ferramentas */}
          <TabsContent value="tools" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    <CardTitle>Calculadora Inteligente de Impostos</CardTitle>
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
    </PageLayout>
  );
};

export default FinancesPage;
