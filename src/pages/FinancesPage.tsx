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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Calculator, Calendar, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { usePayments } from '@/hooks/usePayments';

const FinancesPage = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const currentYear = new Date().getFullYear();

  const { expenses, isLoading: isLoadingExpenses } = useExpenses();
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

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#3f9094]">Gestão Financeira Completa</h1>
            <p className="text-gray-600 mt-2">Dashboard de finanças, impostos e obrigações fiscais</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="impostos" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Impostos</span>
            </TabsTrigger>
            <TabsTrigger value="calculadora" className="flex items-center gap-2 relative">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Calculadora</span>
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                NOVO
              </span>
            </TabsTrigger>
            <TabsTrigger value="mensal" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Mensal</span>
            </TabsTrigger>
            <TabsTrigger value="balanco" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Balanço</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="prazos" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Prazos</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <CashFlowDashboard payments={paymentsData} expenses={expenses} />
          </TabsContent>

          <TabsContent value="impostos" className="space-y-6">
            <TaxBreakdown payments={paymentsData} expenses={expenses} year={currentYear} />
          </TabsContent>

          <TabsContent value="calculadora" className="space-y-6">
            <SmartTaxCalculator />
          </TabsContent>

          <TabsContent value="mensal" className="space-y-6">
            <MonthlyAnalysis payments={paymentsData} expenses={expenses} />
          </TabsContent>

          <TabsContent value="balanco" className="space-y-6">
            <BalanceSheet payments={paymentsData} expenses={expenses} />
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-6">
            <FiscalReports payments={paymentsData} expenses={expenses} />
          </TabsContent>

          <TabsContent value="prazos" className="space-y-6">
            <FiscalDeadlines year={currentYear} />
          </TabsContent>
        </Tabs>

        {/* Seção de Gestão */}
        <Tabs defaultValue="income" className="w-full">
        <TabsList className="mb-4 grid grid-cols-2 max-w-md">
          <TabsTrigger value="income" className="gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            Receitas
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            Despesas
          </TabsTrigger>
        </TabsList>
          
        <TabsContent value="income">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f9094]"></div>
              <span className="ml-2">Carregando dados financeiros...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-red-500 font-medium mb-2">Erro ao carregar dados financeiros</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={fetchPayments}
                  className="px-4 py-2 bg-[#3f9094] text-white rounded-md hover:bg-[#2A5854]"
              >
                Tentar Novamente
              </button>
            </div>
          ) : payments.length === 0 ? (
            <EmptyFinanceState />
          ) : (
            <FinancialReport initialPayments={payments} />
          )}
        </TabsContent>
          
        <TabsContent value="expenses">
          <ExpenseManager />
        </TabsContent>
      </Tabs>
      </div>

      {/* Chatbot Financeiro - Disponível em todas as abas */}
      <FinancialChatbot />
    </PageLayout>
  );
};

export default FinancesPage;
