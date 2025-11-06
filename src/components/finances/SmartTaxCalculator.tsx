import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, Users, FileText, AlertCircle, RefreshCw, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const IVA_RATE = 0.23;
const SS_BASE_RATE = 0.214;
const SS_MIN_BASE = 871.58;

const IRS_RATES = [
  { min: 0, max: 7703, rate: 0.145, deduction: 0, label: '0€ - 7.703€' },
  { min: 7703, max: 11623, rate: 0.21, deduction: 500.70, label: '7.703€ - 11.623€' },
  { min: 11623, max: 16472, rate: 0.265, deduction: 1140.15, label: '11.623€ - 16.472€' },
  { min: 16472, max: 21321, rate: 0.285, deduction: 1469.65, label: '16.472€ - 21.321€' },
  { min: 21321, max: 27146, rate: 0.35, deduction: 2855.55, label: '21.321€ - 27.146€' },
  { min: 27146, max: 39791, rate: 0.37, deduction: 3398.42, label: '27.146€ - 39.791€' },
  { min: 39791, max: 51997, rate: 0.435, deduction: 5984.31, label: '39.791€ - 51.997€' },
  { min: 51997, max: 81199, rate: 0.45, deduction: 6764.12, label: '51.997€ - 81.199€' },
  { min: 81199, max: Infinity, rate: 0.48, deduction: 9201.88, label: '81.199€+' }
];

const calculateIRS = (taxableIncome: number): number => {
  const bracket = IRS_RATES.find(r => taxableIncome >= r.min && taxableIncome < r.max) || IRS_RATES[IRS_RATES.length - 1];
  return Math.max(0, taxableIncome * bracket.rate - bracket.deduction);
};

export const SmartTaxCalculator: React.FC = () => {
  const [ivaRevenue, setIvaRevenue] = useState<string>('');
  const [ivaExpenses, setIvaExpenses] = useState<string>('');
  
  const [irsRevenue, setIrsRevenue] = useState<string>('');
  const [irsExpenses, setIrsExpenses] = useState<string>('');
  const [irsCoefficient, setIrsCoefficient] = useState<string>('0.75');
  
  const [ssRevenue, setSsRevenue] = useState<string>('');
  const [ssPeriod, setSsPeriod] = useState<'mensal' | 'anual'>('anual');
  
  const [fullRevenue, setFullRevenue] = useState<string>('');
  const [fullExpenses, setFullExpenses] = useState<string>('');
  const [fullPeriod, setFullPeriod] = useState<'trimestral' | 'anual'>('anual');

  const ivaResults = useMemo(() => {
    const revenue = parseFloat(ivaRevenue) || 0;
    const expenses = parseFloat(ivaExpenses) || 0;
    
    const ivaLiquidado = revenue * IVA_RATE;
    const ivaDedutivel = expenses * IVA_RATE;
    const ivaToPay = Math.max(0, ivaLiquidado - ivaDedutivel);
    
    return {
      revenue,
      expenses,
      ivaLiquidado,
      ivaDedutivel,
      ivaToPay,
      revenueWithoutVat: revenue / 1.23,
      expensesWithoutVat: expenses / 1.23
    };
  }, [ivaRevenue, ivaExpenses]);

  const irsResults = useMemo(() => {
    const revenue = parseFloat(irsRevenue) || 0;
    const expenses = parseFloat(irsExpenses) || 0;
    const coefficient = parseFloat(irsCoefficient) || 0.75;
    
    const profit = revenue - expenses;
    const taxableIncome = profit * coefficient;
    const irsAmount = calculateIRS(taxableIncome);
    
    const bracket = IRS_RATES.find(r => taxableIncome >= r.min && taxableIncome < r.max) || IRS_RATES[IRS_RATES.length - 1];
    
    const pagamentosPorConta = [
      { name: '1ª Prestação (Julho)', value: irsAmount * 0.2267 },
      { name: '2ª Prestação (Setembro)', value: irsAmount * 0.2267 },
      { name: '3ª Prestação (Dezembro)', value: irsAmount * 0.2267 }
    ];
    
    return {
      revenue,
      expenses,
      profit,
      coefficient,
      taxableIncome,
      irsAmount,
      effectiveRate: revenue > 0 ? (irsAmount / revenue) * 100 : 0,
      bracket,
      pagamentosPorConta,
      totalPagamentos: pagamentosPorConta.reduce((acc, p) => acc + p.value, 0)
    };
  }, [irsRevenue, irsExpenses, irsCoefficient]);

  const ssResults = useMemo(() => {
    const revenue = parseFloat(ssRevenue) || 0;
    const monthlyRevenue = ssPeriod === 'anual' ? revenue / 12 : revenue;
    const base = Math.max(monthlyRevenue, SS_MIN_BASE);
    const monthly = base * SS_BASE_RATE;
    const annual = monthly * 12;
    
    return {
      revenue,
      period: ssPeriod,
      monthlyRevenue,
      base,
      monthly,
      annual,
      effectiveRate: revenue > 0 ? (annual / (ssPeriod === 'anual' ? revenue : revenue * 12)) * 100 : 0
    };
  }, [ssRevenue, ssPeriod]);

  const fullResults = useMemo(() => {
    const revenue = parseFloat(fullRevenue) || 0;
    const expenses = parseFloat(fullExpenses) || 0;
    const multiplier = fullPeriod === 'trimestral' ? 4 : 1;
    
    const annualRevenue = revenue * multiplier;
    const annualExpenses = expenses * multiplier;
    
    const ivaLiquidado = annualRevenue * IVA_RATE;
    const ivaDedutivel = annualExpenses * IVA_RATE;
    const ivaToPay = Math.max(0, ivaLiquidado - ivaDedutivel);
    
    const profit = annualRevenue - annualExpenses;
    const taxableIncome = profit * 0.75;
    const irsAmount = calculateIRS(taxableIncome);
    
    const monthlyRevenue = annualRevenue / 12;
    const ssBase = Math.max(monthlyRevenue, SS_MIN_BASE);
    const ssAnnual = ssBase * SS_BASE_RATE * 12;
    
    const totalTaxes = ivaToPay + irsAmount + ssAnnual;
    const netProfit = profit - totalTaxes;
    const taxBurden = annualRevenue > 0 ? (totalTaxes / annualRevenue) * 100 : 0;
    
    return {
      revenue: annualRevenue,
      expenses: annualExpenses,
      profit,
      ivaToPay,
      irsAmount,
      ssAnnual,
      totalTaxes,
      netProfit,
      taxBurden,
      netMargin: annualRevenue > 0 ? (netProfit / annualRevenue) * 100 : 0
    };
  }, [fullRevenue, fullExpenses, fullPeriod]);

  const handleCopyResults = (results: any, type: string) => {
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text);
    toast.success(`Resultados de ${type} copiados!`);
  };

  const handleExportPDF = (type: string) => {
    toast.info(`Exportação de ${type} em desenvolvimento...`);
  };

  const handleReset = (type: string) => {
    switch (type) {
      case 'iva':
        setIvaRevenue('');
        setIvaExpenses('');
        break;
      case 'irs':
        setIrsRevenue('');
        setIrsExpenses('');
        setIrsCoefficient('0.75');
        break;
      case 'ss':
        setSsRevenue('');
        setSsPeriod('anual');
        break;
      case 'full':
        setFullRevenue('');
        setFullExpenses('');
        setFullPeriod('anual');
        break;
    }
    toast.success('Calculadora resetada!');
  };

  return (
    <Card className="w-full bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Calculator className="h-6 w-6 text-blue-600" />
          Calculadora Fiscal Inteligente
        </CardTitle>
        <CardDescription>
          Calcule impostos, obrigações fiscais e lucro líquido automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="full" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="full">Completa</TabsTrigger>
            <TabsTrigger value="iva">IVA</TabsTrigger>
            <TabsTrigger value="irs">IRS</TabsTrigger>
            <TabsTrigger value="ss">Seg. Social</TabsTrigger>
          </TabsList>

          {/* Calculadora Completa */}
          <TabsContent value="full" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full-revenue">Receita</Label>
                <Input
                  id="full-revenue"
                  type="number"
                  placeholder="Ex: 50000"
                  value={fullRevenue}
                  onChange={(e) => setFullRevenue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full-expenses">Despesas</Label>
                <Input
                  id="full-expenses"
                  type="number"
                  placeholder="Ex: 15000"
                  value={fullExpenses}
                  onChange={(e) => setFullExpenses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full-period">Período</Label>
                <Select value={fullPeriod} onValueChange={(value: any) => setFullPeriod(value)}>
                  <SelectTrigger id="full-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => handleReset('full')} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" onClick={() => handleCopyResults(fullResults, 'Completa')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {fullRevenue && fullExpenses && (
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-700">IVA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600">
                        €{fullResults.ivaToPay.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {fullPeriod === 'trimestral' ? 'Por trimestre' : 'Anual'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-red-700">IRS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">
                        €{fullResults.irsAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-red-600 mt-1">Anual</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-700">Seg. Social</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        €{fullResults.ssAnnual.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Anual</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-purple-700">Total Impostos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-purple-600">
                        €{fullResults.totalTaxes.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {fullResults.taxBurden.toFixed(1)}% da receita
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <TrendingUp className="h-5 w-5" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-amber-700">Receita {fullPeriod === 'anual' ? 'Anual' : 'Trimestral'}:</span>
                      <span className="font-bold text-amber-900">
                        €{fullResults.revenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-amber-700">Despesas:</span>
                      <span className="font-bold text-amber-900">
                        €{fullResults.expenses.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-amber-700">Lucro Bruto:</span>
                      <span className="font-bold text-amber-900">
                        €{fullResults.profit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t border-amber-300 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-amber-800">Lucro Líquido:</span>
                        <span className="text-2xl font-bold text-amber-900">
                          €{fullResults.netProfit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1 text-right">
                        Margem: {fullResults.netMargin.toFixed(1)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Calculadora IVA */}
          <TabsContent value="iva" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iva-revenue">Receita (com IVA)</Label>
                <Input
                  id="iva-revenue"
                  type="number"
                  placeholder="Ex: 10000"
                  value={ivaRevenue}
                  onChange={(e) => setIvaRevenue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iva-expenses">Despesas (com IVA)</Label>
                <Input
                  id="iva-expenses"
                  type="number"
                  placeholder="Ex: 3000"
                  value={ivaExpenses}
                  onChange={(e) => setIvaExpenses(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleReset('iva')} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" onClick={() => handleCopyResults(ivaResults, 'IVA')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {ivaRevenue && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">IVA Liquidado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-blue-600">
                        €{ivaResults.ivaLiquidado.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">IVA Dedutível</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-green-600">
                        €{ivaResults.ivaDedutivel.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">IVA a Pagar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-red-600">
                        €{ivaResults.ivaToPay.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Valores sem IVA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Receita sem IVA:</span>
                      <span className="font-semibold">
                        €{ivaResults.revenueWithoutVat.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Despesas sem IVA:</span>
                      <span className="font-semibold">
                        €{ivaResults.expensesWithoutVat.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Calculadora IRS */}
          <TabsContent value="irs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="irs-revenue">Receita Anual</Label>
                <Input
                  id="irs-revenue"
                  type="number"
                  placeholder="Ex: 50000"
                  value={irsRevenue}
                  onChange={(e) => setIrsRevenue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="irs-expenses">Despesas Anuais</Label>
                <Input
                  id="irs-expenses"
                  type="number"
                  placeholder="Ex: 15000"
                  value={irsExpenses}
                  onChange={(e) => setIrsExpenses(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="irs-coefficient">Coeficiente</Label>
                <Select value={irsCoefficient} onValueChange={setIrsCoefficient}>
                  <SelectTrigger id="irs-coefficient">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.75">75% (Simplificado)</SelectItem>
                    <SelectItem value="0.35">35% (Contabilidade Organizada)</SelectItem>
                    <SelectItem value="1.00">100% (Despesas Reais)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={() => handleReset('irs')} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" onClick={() => handleCopyResults(irsResults, 'IRS')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {irsRevenue && irsExpenses && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader>
                      <CardTitle className="text-sm">IRS Estimado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-red-600">
                        €{irsResults.irsAmount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-red-700 mt-2">
                        Taxa efetiva: {irsResults.effectiveRate.toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-sm">Cálculo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Lucro:</span>
                        <span className="font-semibold">
                          €{irsResults.profit.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rendimento Tributável ({(irsResults.coefficient * 100).toFixed(0)}%):</span>
                        <span className="font-semibold">
                          €{irsResults.taxableIncome.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escalão:</span>
                        <span className="font-semibold">{irsResults.bracket.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa marginal:</span>
                        <span className="font-semibold">{(irsResults.bracket.rate * 100).toFixed(1)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pagamentos por Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {irsResults.pagamentosPorConta.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-white rounded">
                        <span className="text-sm">{p.name}</span>
                        <span className="font-semibold">
                          €{p.value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total (68%):</span>
                        <span className="text-lg">
                          €{irsResults.totalPagamentos.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Calculadora Segurança Social */}
          <TabsContent value="ss" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ss-revenue">Receita</Label>
                <Input
                  id="ss-revenue"
                  type="number"
                  placeholder="Ex: 30000"
                  value={ssRevenue}
                  onChange={(e) => setSsRevenue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ss-period">Período</Label>
                <Select value={ssPeriod} onValueChange={(value: any) => setSsPeriod(value)}>
                  <SelectTrigger id="ss-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleReset('ss')} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" onClick={() => handleCopyResults(ssResults, 'Segurança Social')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {ssRevenue && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-sm">Pagamento Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">
                        €{ssResults.monthly.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-green-700 mt-2">
                        Pagamento até dia 20 de cada mês
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-sm">Total Anual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">
                        €{ssResults.annual.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-green-700 mt-2">
                        Taxa efetiva: {ssResults.effectiveRate.toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Detalhes do Cálculo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Receita {ssPeriod}:</span>
                      <span className="font-semibold">
                        €{ssResults.revenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Receita mensal média:</span>
                      <span className="font-semibold">
                        €{ssResults.monthlyRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Base mínima:</span>
                      <span className="font-semibold">€{SS_MIN_BASE.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-semibold">Base de incidência:</span>
                      <span className="font-bold">
                        €{ssResults.base.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taxa:</span>
                      <span className="font-semibold">{(SS_BASE_RATE * 100).toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
              <AlertCircle className="h-4 w-4" />
              Notas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1 text-blue-800">
            <p>• Valores calculados são <strong>estimativas</strong> baseadas nas taxas atuais (2024)</p>
            <p>• Para IRS, considera-se regime simplificado (coeficiente 75%) por padrão</p>
            <p>• Segurança Social usa base mínima de €871.58 (2024)</p>
            <p>• <strong>Consulte sempre um contabilista</strong> para valores exatos e planeamento fiscal</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default SmartTaxCalculator;

