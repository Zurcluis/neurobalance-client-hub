import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, FileText, Users, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, getQuarter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaxBreakdownProps {
  payments: any[];
  expenses: any[];
  year: number;
}

const IVA_RATE = 0.23;
const IRS_COEFFICIENT = 0.75;
const IRS_RATE = 0.285;
const SS_BASE_RATE = 0.214;
const SS_MIN_BASE = 871.58;

export const TaxBreakdown: React.FC<TaxBreakdownProps> = ({ payments, expenses, year }) => {
  const taxData = useMemo(() => {
    const yearPayments = payments.filter(p => new Date(p.data).getFullYear() === year);
    const yearExpenses = expenses.filter(e => new Date(e.data).getFullYear() === year);

    const totalRevenue = yearPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
    const totalExpenses = yearExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);

    const ivaLiquidado = totalRevenue * IVA_RATE;
    
    const ivaDedutivel = yearExpenses.reduce((acc, expense) => {
      const expenseIva = (expense.valor || 0) * IVA_RATE;
      return acc + expenseIva;
    }, 0);

    const ivaToPay = Math.max(0, ivaLiquidado - ivaDedutivel);

    const profitBeforeTax = totalRevenue - totalExpenses;
    const taxableIncome = profitBeforeTax * IRS_COEFFICIENT;
    const irsEstimated = Math.max(0, taxableIncome * IRS_RATE);

    const monthlyRevenue = totalRevenue / 12;
    const ssBase = Math.max(monthlyRevenue, SS_MIN_BASE);
    const ssMonthly = ssBase * SS_BASE_RATE;
    const ssAnnual = ssMonthly * 12;

    const quarterlyData = [1, 2, 3, 4].map(quarter => {
      const quarterPayments = yearPayments.filter(p => getQuarter(new Date(p.data)) === quarter);
      const quarterExpenses = yearExpenses.filter(e => getQuarter(new Date(e.data)) === quarter);
      
      const qRevenue = quarterPayments.reduce((acc, p) => acc + (p.valor || 0), 0);
      const qExpenses = quarterExpenses.reduce((acc, e) => acc + (e.valor || 0), 0);
      
      const qIvaLiquidado = qRevenue * IVA_RATE;
      const qIvaDedutivel = qExpenses * IVA_RATE;
      const qIvaToPay = Math.max(0, qIvaLiquidado - qIvaDedutivel);
      
      return {
        quarter: `T${quarter}`,
        ivaLiquidado: qIvaLiquidado,
        ivaDedutivel: qIvaDedutivel,
        ivaPagar: qIvaToPay,
        receita: qRevenue,
        despesas: qExpenses
      };
    });

    return {
      totalRevenue,
      totalExpenses,
      ivaLiquidado,
      ivaDedutivel,
      ivaToPay,
      profitBeforeTax,
      taxableIncome,
      irsEstimated,
      ssMonthly,
      ssAnnual,
      ssBase,
      quarterlyData
    };
  }, [payments, expenses, year]);

  const taxDistribution = [
    { name: 'IVA', value: taxData.ivaToPay, color: '#3b82f6' },
    { name: 'IRS', value: taxData.irsEstimated, color: '#ef4444' },
    { name: 'Seg. Social', value: taxData.ssAnnual, color: '#10b981' }
  ];

  const totalTaxes = taxDistribution.reduce((acc, t) => acc + t.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white to-blue-50 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">IVA a Pagar</CardTitle>
            <Calculator className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              €{taxData.ivaToPay.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600">
                Liquidado: €{taxData.ivaLiquidado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-600">
                Dedutível: €{taxData.ivaDedutivel.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-red-50 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">IRS Estimado</CardTitle>
            <FileText className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              €{taxData.irsEstimated.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600">
                Rendimento tributável: €{taxData.taxableIncome.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-600">
                Coeficiente: {(IRS_COEFFICIENT * 100).toFixed(0)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Segurança Social</CardTitle>
            <Users className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{taxData.ssAnnual.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600">
                Mensal: €{taxData.ssMonthly.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-600">
                Base: €{taxData.ssBase.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50 border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Impostos</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              €{totalTaxes.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600">
                Carga fiscal: {((totalTaxes / taxData.totalRevenue) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600">
                Lucro após impostos: €{(taxData.profitBeforeTax - totalTaxes).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              IVA Trimestral {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taxData.quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="quarter" fontSize={12} />
                  <YAxis 
                    tickFormatter={(value) => `€${value.toLocaleString('pt-PT')}`} 
                    fontSize={12} 
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 
                      name
                    ]}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="ivaLiquidado" name="IVA Liquidado" fill="#3b82f6" />
                  <Bar dataKey="ivaDedutivel" name="IVA Dedutível" fill="#10b981" />
                  <Bar dataKey="ivaPagar" name="IVA a Pagar" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distribuição de Impostos {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taxDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {taxDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`, 'Valor']}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {taxDistribution.map((tax, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tax.color }}></div>
                    <span className="text-sm font-medium">{tax.name}</span>
                  </div>
                  <span className="text-sm font-bold">
                    €{tax.value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-amber-500">
        <CardHeader>
          <CardTitle className="text-amber-800">Notas Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900">
          <p>• <strong>IVA Trimestral:</strong> Declaração até ao dia 15 do 2º mês após o trimestre</p>
          <p>• <strong>Segurança Social:</strong> Pagamento até ao dia 20 de cada mês</p>
          <p>• <strong>IRS:</strong> Declaração anual (Modelo 3) até 30 de junho do ano seguinte</p>
          <p>• <strong>Pagamentos por Conta:</strong> 3 prestações (julho, setembro, dezembro) - 66,67% do IRS do ano anterior</p>
          <p className="pt-2 text-xs italic">
            * Valores estimados. Consulte o seu contabilista para valores exatos e obrigações específicas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxBreakdown;

