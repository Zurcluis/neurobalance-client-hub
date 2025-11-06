import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calculator, FileText, Users, Download, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { getQuarter, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface FiscalReportsProps {
  payments: any[];
  expenses: any[];
}

const IVA_RATE = 0.23;
const IRS_COEFFICIENT = 0.75;
const IRS_RATES = [
  { min: 0, max: 7703, rate: 0.145, deduction: 0 },
  { min: 7703, max: 11623, rate: 0.21, deduction: 500.70 },
  { min: 11623, max: 16472, rate: 0.265, deduction: 1140.15 },
  { min: 16472, max: 21321, rate: 0.285, deduction: 1469.65 },
  { min: 21321, max: 27146, rate: 0.35, deduction: 2855.55 },
  { min: 27146, max: 39791, rate: 0.37, deduction: 3398.42 },
  { min: 39791, max: 51997, rate: 0.435, deduction: 5984.31 },
  { min: 51997, max: 81199, rate: 0.45, deduction: 6764.12 },
  { min: 81199, max: Infinity, rate: 0.48, deduction: 9201.88 }
];
const SS_BASE_RATE = 0.214;
const SS_MIN_BASE = 871.58;

const calculateIRS = (taxableIncome: number): number => {
  const bracket = IRS_RATES.find(r => taxableIncome >= r.min && taxableIncome < r.max) || IRS_RATES[IRS_RATES.length - 1];
  return Math.max(0, taxableIncome * bracket.rate - bracket.deduction);
};

export const FiscalReports: React.FC<FiscalReportsProps> = ({ payments, expenses }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(getQuarter(new Date()));

  const ivaQuarterlyReport = useMemo(() => {
    const quarterDate = new Date(selectedYear, (selectedQuarter - 1) * 3);
    const quarterStart = startOfQuarter(quarterDate);
    const quarterEnd = endOfQuarter(quarterDate);

    const quarterPayments = payments.filter(p => {
      const paymentDate = parseISO(p.data);
      return isWithinInterval(paymentDate, { start: quarterStart, end: quarterEnd });
    });

    const quarterExpenses = expenses.filter(e => {
      const expenseDate = parseISO(e.data);
      return isWithinInterval(expenseDate, { start: quarterStart, end: quarterEnd });
    });

    const totalRevenue = quarterPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
    const totalExpenses = quarterExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);

    const ivaLiquidado = totalRevenue * IVA_RATE;
    const ivaDedutivel = totalExpenses * IVA_RATE;
    const ivaToPay = Math.max(0, ivaLiquidado - ivaDedutivel);

    const deadlineMonth = (selectedQuarter * 3) + 2;
    const deadlineDate = new Date(selectedYear, deadlineMonth - 1, 15);

    return {
      period: `${selectedQuarter}º Trimestre ${selectedYear}`,
      periodStart: format(quarterStart, 'dd/MM/yyyy', { locale: ptBR }),
      periodEnd: format(quarterEnd, 'dd/MM/yyyy', { locale: ptBR }),
      totalRevenue,
      totalExpenses,
      ivaLiquidado,
      ivaDedutivel,
      ivaToPay,
      deadline: format(deadlineDate, 'dd/MM/yyyy', { locale: ptBR }),
      isPastDue: new Date() > deadlineDate
    };
  }, [payments, expenses, selectedYear, selectedQuarter]);

  const ssReport = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0));
    const yearEnd = endOfYear(new Date(selectedYear, 0));

    const yearPayments = payments.filter(p => {
      const paymentDate = parseISO(p.data);
      return isWithinInterval(paymentDate, { start: yearStart, end: yearEnd });
    });

    const totalRevenue = yearPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
    const monthlyRevenue = totalRevenue / 12;
    const ssBase = Math.max(monthlyRevenue, SS_MIN_BASE);
    const ssMonthly = ssBase * SS_BASE_RATE;
    const ssAnnual = ssMonthly * 12;

    const monthlyPayments = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(selectedYear, month, 1);
      const monthEnd = new Date(selectedYear, month + 1, 0);
      const deadline = new Date(selectedYear, month, 20);

      const monthRevenue = payments.filter(p => {
        const paymentDate = parseISO(p.data);
        return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd });
      }).reduce((acc, p) => acc + (p.valor || 0), 0);

      monthlyPayments.push({
        month: format(monthStart, 'MMMM yyyy', { locale: ptBR }),
        revenue: monthRevenue,
        ssPayment: ssMonthly,
        deadline: format(deadline, 'dd/MM/yyyy', { locale: ptBR }),
        isPastDue: new Date() > deadline
      });
    }

    return {
      year: selectedYear,
      totalRevenue,
      monthlyRevenue,
      ssBase,
      ssMonthly,
      ssAnnual,
      monthlyPayments
    };
  }, [payments, selectedYear]);

  const irsReport = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0));
    const yearEnd = endOfYear(new Date(selectedYear, 0));

    const yearPayments = payments.filter(p => {
      const paymentDate = parseISO(p.data);
      return isWithinInterval(paymentDate, { start: yearStart, end: yearEnd });
    });

    const yearExpenses = expenses.filter(e => {
      const expenseDate = parseISO(e.data);
      return isWithinInterval(expenseDate, { start: yearStart, end: yearEnd });
    });

    const totalRevenue = yearPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
    const totalExpenses = yearExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);
    const profitBeforeTax = totalRevenue - totalExpenses;
    const taxableIncome = profitBeforeTax * IRS_COEFFICIENT;
    const irsEstimated = calculateIRS(taxableIncome);

    const pagamentosPorConta = [
      {
        name: '1ª Prestação (Julho)',
        value: irsEstimated * 0.2267,
        deadline: `31/07/${selectedYear + 1}`,
        isPastDue: new Date() > new Date(selectedYear + 1, 6, 31)
      },
      {
        name: '2ª Prestação (Setembro)',
        value: irsEstimated * 0.2267,
        deadline: `30/09/${selectedYear + 1}`,
        isPastDue: new Date() > new Date(selectedYear + 1, 8, 30)
      },
      {
        name: '3ª Prestação (Dezembro)',
        value: irsEstimated * 0.2267,
        deadline: `31/12/${selectedYear + 1}`,
        isPastDue: new Date() > new Date(selectedYear + 1, 11, 31)
      }
    ];

    return {
      year: selectedYear,
      totalRevenue,
      totalExpenses,
      profitBeforeTax,
      coefficient: IRS_COEFFICIENT,
      taxableIncome,
      irsEstimated,
      declarationDeadline: `30/06/${selectedYear + 1}`,
      pagamentosPorConta,
      totalPagamentosPorConta: pagamentosPorConta.reduce((acc, p) => acc + p.value, 0)
    };
  }, [payments, expenses, selectedYear]);

  const handleExportIVA = () => {
    const data = {
      periodo: ivaQuarterlyReport.period,
      dataInicio: ivaQuarterlyReport.periodStart,
      dataFim: ivaQuarterlyReport.periodEnd,
      receitaTotal: ivaQuarterlyReport.totalRevenue,
      despesasTotal: ivaQuarterlyReport.totalExpenses,
      ivaLiquidado: ivaQuarterlyReport.ivaLiquidado,
      ivaDedutivel: ivaQuarterlyReport.ivaDedutivel,
      ivaPagar: ivaQuarterlyReport.ivaToPay,
      prazo: ivaQuarterlyReport.deadline
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `iva-t${selectedQuarter}-${selectedYear}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Relatório IVA exportado com sucesso!');
  };

  const handleExportIRS = () => {
    const data = {
      ano: irsReport.year,
      receitaTotal: irsReport.totalRevenue,
      despesasTotal: irsReport.totalExpenses,
      lucroAntesImpostos: irsReport.profitBeforeTax,
      coeficiente: irsReport.coefficient,
      rendimentoTributavel: irsReport.taxableIncome,
      irsEstimado: irsReport.irsEstimated,
      prazoDeclaracao: irsReport.declarationDeadline,
      pagamentosPorConta: irsReport.pagamentosPorConta
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `irs-${selectedYear}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Relatório IRS exportado com sucesso!');
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Ano</label>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="iva" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="iva">IVA</TabsTrigger>
          <TabsTrigger value="ss">Segurança Social</TabsTrigger>
          <TabsTrigger value="irs">IRS</TabsTrigger>
        </TabsList>

        <TabsContent value="iva" className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Trimestre</label>
              <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(Number(v))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map(q => (
                    <SelectItem key={q} value={q.toString()}>
                      {q}º Trimestre
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="self-end">
              <Button onClick={handleExportIVA} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          <Card className={`bg-gradient-to-br ${ivaQuarterlyReport.isPastDue ? 'from-red-50 to-orange-50 border-l-4 border-l-red-500' : 'from-white to-blue-50 border-l-4 border-l-blue-500'}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Declaração de IVA - {ivaQuarterlyReport.period}
                </span>
                {ivaQuarterlyReport.isPastDue ? (
                  <span className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm">Prazo Expirado</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm">Dentro do Prazo</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Período: {ivaQuarterlyReport.periodStart} - {ivaQuarterlyReport.periodEnd}</p>
                  <p className="text-sm font-medium">Prazo de Entrega: <span className="text-blue-600">{ivaQuarterlyReport.deadline}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-l-green-500">
                  <p className="text-sm text-gray-600 mb-1">IVA Liquidado</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{ivaQuarterlyReport.ivaLiquidado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Receitas: €{ivaQuarterlyReport.totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-l-blue-500">
                  <p className="text-sm text-gray-600 mb-1">IVA Dedutível</p>
                  <p className="text-2xl font-bold text-blue-600">
                    €{ivaQuarterlyReport.ivaDedutivel.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Despesas: €{ivaQuarterlyReport.totalExpenses.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-l-red-500">
                  <p className="text-sm text-gray-600 mb-1">IVA a Pagar</p>
                  <p className="text-2xl font-bold text-red-600">
                    €{ivaQuarterlyReport.ivaToPay.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Liquidado - Dedutível
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Nota:</strong> A declaração periódica de IVA deve ser submetida até ao dia 15 do segundo mês seguinte ao final do trimestre.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ss" className="space-y-6">
          <Card className="bg-gradient-to-br from-white to-green-50 border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Segurança Social - {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Receita Anual</p>
                  <p className="text-xl font-bold text-green-600">
                    €{ssReport.totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Base de Incidência</p>
                  <p className="text-xl font-bold text-blue-600">
                    €{ssReport.ssBase.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Contribuição Mensal</p>
                  <p className="text-xl font-bold text-orange-600">
                    €{ssReport.ssMonthly.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total Anual</p>
                  <p className="text-xl font-bold text-red-600">
                    €{ssReport.ssAnnual.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-4">Calendário de Pagamentos {selectedYear}</h4>
                <div className="space-y-2">
                  {ssReport.monthlyPayments.map((payment, idx) => (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        payment.isPastDue ? 'bg-red-50 border-l-4 border-l-red-500' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {payment.isPastDue ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Calendar className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="font-medium capitalize">{payment.month}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          Prazo: {payment.deadline}
                        </span>
                        <span className="font-bold text-green-600">
                          €{payment.ssPayment.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-900">
                  <strong>Nota:</strong> O pagamento das contribuições à Segurança Social deve ser efetuado até ao dia 20 de cada mês. A base de incidência é calculada com base na média dos últimos 3 meses de rendimentos relevantes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="irs" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleExportIRS} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>

          <Card className="bg-gradient-to-br from-white to-red-50 border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                IRS - Simulação {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                  <p className="text-xl font-bold text-green-600">
                    €{irsReport.totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Despesas</p>
                  <p className="text-xl font-bold text-orange-600">
                    €{irsReport.totalExpenses.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Rendimento Tributável</p>
                  <p className="text-xl font-bold text-blue-600">
                    €{irsReport.taxableIncome.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coeficiente: {(irsReport.coefficient * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">IRS Estimado</p>
                  <p className="text-xl font-bold text-red-600">
                    €{irsReport.irsEstimated.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border-l-4 border-l-blue-500">
                <h4 className="font-semibold mb-4">Pagamentos por Conta {selectedYear + 1}</h4>
                <div className="space-y-3">
                  {irsReport.pagamentosPorConta.map((payment, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="font-medium">{payment.name}</p>
                          <p className="text-sm text-gray-600">Prazo: {payment.deadline}</p>
                        </div>
                      </div>
                      <span className="font-bold text-blue-600">
                        €{payment.value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="font-semibold">Total Pagamentos por Conta</span>
                    <span className="text-xl font-bold text-blue-600">
                      €{irsReport.totalPagamentosPorConta.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-900 space-y-2">
                  <strong>Prazos Importantes:</strong>
                  <br />
                  • <strong>Declaração Modelo 3:</strong> Até {irsReport.declarationDeadline}
                  <br />
                  • <strong>Pagamentos por Conta:</strong> 3 prestações de 22,67% do IRS do ano anterior
                  <br />
                  • <strong>Nota:</strong> Esta é uma simulação. Consulte o seu contabilista para valores exatos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FiscalReports;

