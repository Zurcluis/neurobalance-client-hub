import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown, 
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  PiggyBank,
  ArrowRight
} from 'lucide-react';
import { format, addMonths, differenceInMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LoanTrackerProps {
  expenses: any[];
}

interface LoanData {
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  estimatedEndDate: string;
  progressPercentage: number;
  payments: any[];
  firstPaymentDate: string;
  lastPaymentDate: string;
}

const LoanTracker: React.FC<LoanTrackerProps> = ({ expenses }) => {
  
  // Debug: Monitorar mudanças nas despesas
  useEffect(() => {
    console.log('LoanTracker - Despesas recebidas:', expenses?.length || 0);
    if (expenses?.length > 0) {
      // Mostrar categorias únicas para debug
      const categorias = [...new Set(expenses.map(e => e.categoria))];
      const tipos = [...new Set(expenses.map(e => e.tipo))];
      console.log('LoanTracker - Categorias disponíveis:', categorias);
      console.log('LoanTracker - Tipos disponíveis:', tipos);
      
      // Mostrar despesas de empréstimos
      const emprestimos = expenses.filter(e => 
        e.tipo?.toLowerCase() === 'empréstimos' || 
        e.tipo?.toLowerCase() === 'emprestimos'
      );
      console.log('LoanTracker - Despesas de Empréstimos:', emprestimos);
    }
  }, [expenses]);

  const loansData = useMemo(() => {
    // Normalizar string para comparação (remover acentos e lowercase)
    const normalizeStr = (str: string | null | undefined): string => {
      if (!str) return '';
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/\s+/g, ' ') // Normalizar espaços
        .trim();
    };

    // Filtrar despesas "Devolveu Dinheiro"
    // Estrutura esperada: tipo='Empréstimos', categoria='Devolveu Dinheiro'
    const devolveuDinheiroExpenses = expenses.filter(exp => {
      const categoria = normalizeStr(exp.categoria);
      const tipo = normalizeStr(exp.tipo);
      
      // Verificar se é da categoria "Devolveu Dinheiro"
      const isDevolveuCategoria = categoria === 'devolveu dinheiro' || 
                                   categoria.includes('devolveu dinheiro') ||
                                   categoria.startsWith('devolveu');
      
      // Verificar se é do tipo "Empréstimos" com categoria correta
      const isEmprestimoDevolveu = (tipo === 'emprestimos' || tipo === 'empréstimos') && 
                                    isDevolveuCategoria;
      
      return isDevolveuCategoria || isEmprestimoDevolveu;
    });
    
    // Filtrar despesas "Banco BPI"
    const bancoBPIExpenses = expenses.filter(exp => {
      const categoria = normalizeStr(exp.categoria);
      const tipo = normalizeStr(exp.tipo);
      
      // Verificar se é da categoria "Banco BPI"
      const isBPICategoria = categoria === 'banco bpi' || 
                              categoria.includes('banco bpi') ||
                              categoria === 'bpi';
      
      // Verificar se é do tipo "Empréstimos" com categoria correta
      const isEmprestimoBPI = (tipo === 'emprestimos' || tipo === 'empréstimos') && 
                               isBPICategoria;
      
      return isBPICategoria || isEmprestimoBPI;
    });

    // Debug: mostrar quantas despesas foram encontradas
    console.log('LoanTracker - Total despesas recebidas:', expenses.length);
    console.log('LoanTracker - Despesas "Devolveu Dinheiro" encontradas:', devolveuDinheiroExpenses.length);
    if (devolveuDinheiroExpenses.length > 0) {
      console.log('LoanTracker - Detalhes Devolveu Dinheiro:', devolveuDinheiroExpenses.map(e => ({
        id: e.id,
        tipo: e.tipo,
        categoria: e.categoria,
        valor: e.valor,
        data: e.data
      })));
    }
    console.log('LoanTracker - Despesas "Banco BPI" encontradas:', bancoBPIExpenses.length);

    const calculateLoanData = (
      payments: any[], 
      name: string, 
      totalAmount: number
    ): LoanData | null => {
      if (payments.length === 0) {
        return null;
      }

      const sortedPayments = [...payments].sort((a, b) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      );

      const paidAmount = payments.reduce((acc, p) => acc + (p.valor || 0), 0);
      const remainingAmount = Math.max(0, totalAmount - paidAmount);
      
      const monthlyPayments = payments.map(p => p.valor);
      const avgMonthlyPayment = monthlyPayments.length > 0 
        ? monthlyPayments.reduce((a, b) => a + b, 0) / monthlyPayments.length 
        : 0;

      const firstPaymentDate = sortedPayments[0].data;
      const lastPaymentDate = sortedPayments[sortedPayments.length - 1].data;
      
      const monthsPassed = differenceInMonths(
        new Date(lastPaymentDate),
        new Date(firstPaymentDate)
      ) + 1;

      const effectiveMonthlyPayment = monthsPassed > 0 
        ? paidAmount / monthsPassed 
        : avgMonthlyPayment;

      const remainingMonths = effectiveMonthlyPayment > 0 
        ? Math.ceil(remainingAmount / effectiveMonthlyPayment) 
        : 0;

      const estimatedEndDate = remainingMonths > 0
        ? format(addMonths(new Date(lastPaymentDate), remainingMonths), 'MMMM yyyy', { locale: ptBR })
        : 'Concluído';

      const progressPercentage = totalAmount > 0 
        ? (paidAmount / totalAmount) * 100 
        : 0;

      return {
        name,
        totalAmount,
        paidAmount,
        remainingAmount,
        monthlyPayment: effectiveMonthlyPayment,
        estimatedEndDate,
        progressPercentage,
        payments: sortedPayments,
        firstPaymentDate,
        lastPaymentDate
      };
    };

    const devolveuDinheiroLoan = calculateLoanData(
      devolveuDinheiroExpenses,
      'Devolveu Dinheiro',
      12500
    );

    const bancoBPILoan = calculateLoanData(
      bancoBPIExpenses,
      'Banco BPI',
      20000
    );

    return {
      devolveuDinheiro: devolveuDinheiroLoan,
      bancoBPI: bancoBPILoan
    };
  }, [expenses]);

  const renderLoanCard = (loan: LoanData | null) => {
    if (!loan) {
      return null;
    }

    const isCompleted = loan.remainingAmount <= 0;

    return (
      <Card className="overflow-hidden border-t-4 border-t-[#3f9094]">
        <CardHeader className="bg-gradient-to-r from-[#3f9094]/5 to-transparent pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-[#3f9094]" />
                {loan.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {loan.payments.length} pagamentos realizados
              </CardDescription>
            </div>
            {isCompleted ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Concluído
              </Badge>
            ) : (
              <Badge variant="outline" className="border-[#3f9094] text-[#3f9094]">
                Em Andamento
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Valor Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                €{loan.totalAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Já Pago</span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                €{loan.paidAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 mb-2">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">Falta Pagar</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                €{loan.remainingAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Progresso do Empréstimo
              </span>
              <span className="font-bold text-[#3f9094]">
                {loan.progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={loan.progressPercentage} 
              className="h-3"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>€0</span>
              <span>€{loan.totalAmount.toLocaleString('pt-PT')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-purple-100 dark:bg-purple-950/20 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pagamento Médio Mensal
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  €{loan.monthlyPayment.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-amber-100 dark:bg-amber-950/20 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Previsão de Conclusão
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
                  {loan.estimatedEndDate}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Histórico de Pagamentos
              </h4>
              <Badge variant="secondary" className="text-xs">
                {loan.payments.length} pagamento{loan.payments.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {loan.payments.slice(-5).reverse().map((payment, index) => (
                <div 
                  key={payment.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {format(parseISO(payment.data), 'dd MMM yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <span className="font-bold text-[#3f9094]">
                    €{payment.valor.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
            {loan.payments.length > 5 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Mostrando os últimos 5 pagamentos de {loan.payments.length}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const allLoans = [loansData.devolveuDinheiro, loansData.bancoBPI].filter(Boolean) as LoanData[];

  const totalLoansAmount = allLoans.reduce((acc, loan) => acc + loan.totalAmount, 0);
  const totalPaidAmount = allLoans.reduce((acc, loan) => acc + loan.paidAmount, 0);
  const totalRemainingAmount = allLoans.reduce((acc, loan) => acc + loan.remainingAmount, 0);
  const overallProgress = totalLoansAmount > 0 ? (totalPaidAmount / totalLoansAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-[#3f9094]/20 bg-gradient-to-br from-[#3f9094]/5 to-white dark:to-gray-900">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-[#3f9094]" />
            Resumo Geral dos Empréstimos
          </CardTitle>
          <CardDescription>
            Visão consolidada de todos os empréstimos ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Empréstimos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                €{totalLoansAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg shadow-sm">
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">Total Pago</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                €{totalPaidAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg shadow-sm">
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Total a Pagar</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                €{totalRemainingAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg shadow-sm">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Progresso Geral</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {overallProgress.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Progresso Consolidado
              </span>
              <span className="font-bold text-[#3f9094]">
                {overallProgress.toFixed(1)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-4" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderLoanCard(loansData.devolveuDinheiro)}
        {renderLoanCard(loansData.bancoBPI)}
      </div>

      {allLoans.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <PiggyBank className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nenhum empréstimo encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Adicione despesas nas categorias "Devolveu Dinheiro" ou "Banco BPI" para começar a acompanhar seus empréstimos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LoanTracker;

