import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import FinancialReport from '@/components/finances/FinancialReport';
import ExpenseManager from '@/components/finances/ExpenseManager';
import EmptyFinanceState from '@/components/finances/EmptyFinanceState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const FinancesPage = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('income');
  const [totalProfit, setTotalProfit] = useState(0);

  // Função para buscar pagamentos
  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Buscando pagamentos do Supabase...');
      
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
      
      console.log('Pagamentos recebidos do Supabase:', data);
      
      if (!data) {
        console.log('Resposta de pagamentos é undefined ou null');
        setPayments([]);
        return;
      }
      
      if (data.length === 0) {
        console.log('Nenhum pagamento encontrado');
        setPayments([]);
        return;
      }
      
      // Processar os dados
      const formattedPayments = data.map(payment => ({
        ...payment,
        cliente_nome: payment.clientes?.nome || 'Cliente Desconhecido'
      }));
      
      console.log('Pagamentos processados:', formattedPayments);
      setPayments(formattedPayments);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      setError('Falha ao carregar pagamentos');
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar pagamentos ao inicializar
  useEffect(() => {
    fetchPayments();
  }, []);

  // Calcular o lucro total (receitas - despesas)
  useEffect(() => {
    const calculateTotalProfit = async () => {
      try {
        const { data: expenses, error: expensesError } = await supabase
          .from('despesas')
          .select('valor');

        if (expensesError) throw expensesError;

        const totalExpenses = expenses?.reduce((acc, curr) => acc + (curr.valor || 0), 0) || 0;
        const totalRevenue = payments.reduce((acc, curr) => acc + (curr.valor || 0), 0);
        setTotalProfit(totalRevenue - totalExpenses);
      } catch (err) {
        console.error('Erro ao calcular lucro:', err);
      }
    };

    calculateTotalProfit();
  }, [payments]);

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">{t('financialReports')}</h1>
        <p className="text-neuro-gray mt-2">Acompanhe receitas, despesas e pagamentos dos clientes</p>
      </div>
      
      {/* Indicador de Lucro Total */}
      <Card className="glassmorphism mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#3f9094]" />
            Lucro Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            €{totalProfit.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-neuro-gray mt-1">
            Receitas - Despesas
          </p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="income" value={activeTab} onValueChange={setActiveTab} className="mb-6">
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
                className="px-4 py-2 bg-[#3f9094] text-white rounded-md hover:bg-[#265255]"
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
    </PageLayout>
  );
};

export default FinancesPage;
