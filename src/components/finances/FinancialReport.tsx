import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CreditCard, Download, FileText, Search, Users, Calendar, DollarSign, Filter, ArrowUpDown, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database as SupabaseDatabase } from '@/integrations/supabase/types';
import { format, parseISO, isSameMonth, subMonths, isSameYear, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import usePayments, { createSamplePayment } from '@/hooks/usePayments';
import { useLanguage } from '@/hooks/use-language';

// Definições de tipos
type PaymentWithClient = SupabaseDatabase['public']['Tables']['pagamentos']['Row'] & {
  clientes?: {
    nome: string | null;
  } | null;
};

type Payment = Omit<SupabaseDatabase['public']['Tables']['pagamentos']['Row'], 'id_cliente'> & {
  id_cliente: string | number;
  cliente_nome?: string;
  cliente_id_manual?: string;
  agendamento_titulo?: string;
  clientes?: {
    nome: string;
    id_manual: string;
  } | null;
};

// Cores para os gráficos
const CHART_COLORS = ['#1088c4', '#9e50b3', '#3f9094', '#ecc249', '#e67c50', '#6633cc'];

// Métodos de pagamento
const PAYMENT_METHODS = ['Dinheiro', 'Multibanco', 'MBWay', 'Transferência', 'Todos'];

interface FinancialReportProps {
  initialPayments?: any[];
}

const FinancialReport = ({ initialPayments }: FinancialReportProps = {}) => {
  // Hook de traduções
  const { t } = useLanguage();
  
  // Usar o hook de pagamentos
  const { payments: hookPayments, isLoading: paymentsLoading, error: paymentsError, fetchPayments } = usePayments();
  
  // Estado para armazenar pagamentos (usando initialPayments se fornecido)
  const [payments, setPayments] = useState<any[]>(initialPayments || []);
  
  // Estado para gerenciar erros específicos
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Usar pagamentos do hook apenas se não tivermos pagamentos iniciais
  useEffect(() => {
    if (!initialPayments?.length && hookPayments.length > 0) {
      // Processar pagamentos para incluir dados do cliente
      const processedPayments = hookPayments.map((payment: any) => {
        console.log('Payment data:', payment);
        return {
          ...payment,
          cliente_nome: payment.clientes?.nome || null,
          cliente_id_manual: payment.clientes?.id_manual || null
        };
      });
      setPayments(processedPayments);
      setLoadingError(null);
    }
  }, [hookPayments, initialPayments]);
  
  // Verificar erro do hook
  useEffect(() => {
    if (paymentsError) {
      setLoadingError('Falha ao carregar dados de pagamentos');
      console.error('Erro do hook de pagamentos:', paymentsError);
    }
  }, [paymentsError]);
  
  // Função para verificar e tentar corrigir problemas com a tabela de pagamentos
  const verifyPaymentsTable = async () => {
    try {
      // Verificar se a tabela existe
      const { error: tableCheckError } = await supabase
          .from('pagamentos')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.error('Erro ao verificar tabela de pagamentos:', tableCheckError);
        
        if (tableCheckError.code === '42P01') { // Código para tabela inexistente
          setLoadingError('A tabela de pagamentos não existe no banco de dados');
          toast.error('Erro de estrutura do banco de dados');
          return false;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Erro ao verificar tabela de pagamentos:', err);
      setLoadingError('Erro de conexão com o banco de dados');
      toast.error('Falha na conexão com o banco de dados');
      return false;
    }
  };
  
  // Função de recarregamento com verificação
  const handleRefresh = async () => {
    setLoadingError(null);
    const isTableValid = await verifyPaymentsTable();
    if (isTableValid) {
      fetchPayments();
    }
  };
  
  // Verificar tabela ao montar o componente se não houver pagamentos iniciais
  useEffect(() => {
    if (!initialPayments?.length) {
      verifyPaymentsTable();
    }
  }, [initialPayments]);
  
  // Estado para o componente
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: subMonths(new Date(), 6).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('data');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showTableHelpDialog, setShowTableHelpDialog] = useState(false);
  
  // Filtragem de pagamentos
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesDateRange = 
        (!dateRange.start || payment.data >= dateRange.start) && 
        (!dateRange.end || payment.data <= dateRange.end);
      
      const matchesPaymentMethod = 
        paymentMethodFilter === 'Todos' || 
        payment.tipo === paymentMethodFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        (payment.descricao && payment.descricao.toLowerCase().includes(searchLower)) ||
        (payment.cliente_nome && payment.cliente_nome.toLowerCase().includes(searchLower)) ||
        (payment.cliente_id_manual && payment.cliente_id_manual.toLowerCase().includes(searchLower)) ||
        payment.tipo.toLowerCase().includes(searchLower);
      
      return matchesDateRange && matchesPaymentMethod && matchesSearch;
    });
  }, [payments, dateRange, paymentMethodFilter, searchQuery]);
  
  // Ordenação de pagamentos
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      let valueA: any = a[sortColumn as keyof typeof a];
      let valueB: any = b[sortColumn as keyof typeof b];
      
      // Tratamento especial para datas
      if (sortColumn === 'data') {
        valueA = new Date(valueA as string).getTime();
        valueB = new Date(valueB as string).getTime();
      }
      
      // Tratamento especial para valores numéricos
      if (sortColumn === 'valor') {
        valueA = Number(valueA);
        valueB = Number(valueB);
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPayments, sortColumn, sortDirection]);
  
  // Dados para os indicadores
  const totalRevenue = useMemo(() => {
    return filteredPayments.reduce((total, payment) => total + payment.valor, 0);
  }, [filteredPayments]);
  
  const averagePayment = useMemo(() => {
    return filteredPayments.length ? totalRevenue / filteredPayments.length : 0;
  }, [filteredPayments, totalRevenue]);
  
  // Dados para o gráfico de receita por mês
  const revenueByMonth = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    
    // Inicializar os últimos 6 meses
    const today = new Date();
    for (let i = 0; i <= 6; i++) {
      const date = subMonths(today, i);
      const month = format(date, 'MMM yyyy', { locale: ptBR });
      monthlyData[month] = 0;
    }
    
    // Preencher com os dados reais
    filteredPayments.forEach(payment => {
      try {
        const date = parseISO(payment.data);
        const month = format(date, 'MMM yyyy', { locale: ptBR });
        if (monthlyData[month] !== undefined) {
          monthlyData[month] += payment.valor;
        }
      } catch (error) {
        console.error('Erro ao processar data do pagamento:', payment.data);
      }
    });
    
    // Converter para o formato do gráfico
    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .reverse();
  }, [filteredPayments]);
  
  // Dados para o gráfico de distribuição por método de pagamento
  const paymentMethodDistribution = useMemo(() => {
    const methodData: { [key: string]: number } = {};
    
    // Inicializar todos os métodos de pagamento
    PAYMENT_METHODS.forEach(method => {
      if (method !== 'Todos') methodData[method] = 0;
    });
    
    // Preencher com os dados reais
    filteredPayments.forEach(payment => {
      if (methodData[payment.tipo] !== undefined) {
        methodData[payment.tipo] += payment.valor;
          } else {
        methodData[payment.tipo] = payment.valor;
      }
    });
    
    // Converter para o formato do gráfico
    return Object.entries(methodData)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [filteredPayments]);
  
  // Dados para o gráfico de principais clientes
  const topClients = useMemo(() => {
    // Agrupar pagamentos por cliente
    const clientData = filteredPayments.reduce<{ [key: string]: number }>((acc, payment) => {
      const clientId = payment.id_cliente;
      const clientName = payment.cliente_nome || `Cliente ${clientId}`;
      
      if (!acc[clientName]) {
        acc[clientName] = 0;
      }
      
      acc[clientName] += payment.valor;
          return acc;
        }, {});
        
    // Ordenar e pegar os 5 maiores
    return Object.entries(clientData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredPayments]);
  
  // Exportar dados para CSV
  const exportToCSV = () => {
    // Cabeçalhos do CSV
    const csvHeaders = 'ID,Cliente,Data,Valor,Método de Pagamento,Descrição\n';
    
    // Dados formatados para CSV
    const csvData = sortedPayments.map(payment => {
      try {
        const formattedDate = format(parseISO(payment.data), 'dd/MM/yyyy');
        return `${payment.id},"${payment.cliente_nome || ''}","${formattedDate}",${payment.valor},"${payment.tipo}","${payment.descricao || ''}"`;
      } catch (error) {
        return `${payment.id},"${payment.cliente_nome || ''}","${payment.data}",${payment.valor},"${payment.tipo}","${payment.descricao || ''}"`;
      }
    }).join('\n');
    
    // Montar o conteúdo completo
    const csvContent = csvHeaders + csvData;
    
    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportDialogOpen(false);
    toast.success('Relatório exportado com sucesso!');
  };
  
  // Função para ordenar a tabela
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Verificar carregamento
  const isLoading = paymentsLoading && !initialPayments?.length;

  // Se houver erro específico de carregamento
  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <p className="text-xl font-medium text-red-600 mb-4">{loadingError}</p>
          <p className="text-gray-500 mb-6">Verifique a configuração do banco de dados</p>
          <div className="flex gap-3">
            <Button
              variant="default"
              onClick={() => setShowTableHelpDialog(true)}
              className="mx-auto"
            >
              <Database className="h-4 w-4 mr-2" />
              Ver Instruções
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="mx-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f9094] mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }
  
  // Verificar se há dados
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <p className="text-xl font-medium text-gray-700 mb-4">{t('noPayments')}</p>
          <p className="text-gray-500 mb-6">Adicione pagamentos para visualizar relatórios financeiros</p>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="history">{t('paymentHistory')}</TabsTrigger>
          <TabsTrigger value="charts">Gráficos Detalhados</TabsTrigger>
        </TabsList>
        
        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glassmorphism hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#3f9094]" />
                  {t('totalRevenue')}
                </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">€{totalRevenue.toLocaleString('pt-PT')}</div>
            <p className="text-xs text-neuro-gray mt-1">
                  {filteredPayments.length} pagamentos registrados
            </p>
          </CardContent>
        </Card>
        
            <Card className="glassmorphism hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#3f9094]" />
                  {t('averagePayment')}
                </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">€{averagePayment.toFixed(2).replace('.', ',')}</div>
            <p className="text-xs text-neuro-gray mt-1">
                  Por pagamento
            </p>
          </CardContent>
        </Card>
        
            <Card className="glassmorphism hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#3f9094]" />
                  Método mais utilizado
                </CardTitle>
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {paymentMethodDistribution.length > 0 
                    ? paymentMethodDistribution.sort((a, b) => b.value - a.value)[0].name 
                    : "N/A"}
                </div>
            <p className="text-xs text-neuro-gray mt-1">
                  {paymentMethodDistribution.length > 0 
                    ? `€${paymentMethodDistribution.sort((a, b) => b.value - a.value)[0].value.toLocaleString('pt-PT')} em receita total`
                    : "Sem dados disponíveis"}
            </p>
          </CardContent>
        </Card>
      </div>
      
          {/* Gráficos de Visão Geral */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-lg">{t('monthlyRevenue')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueByMonth}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                      <RechartsTooltip
                        formatter={(value: any) => [`€${value}`, 'Receita']}
                        labelFormatter={(label: string) => `Mês: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#3f9094"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-lg">{t('paymentMethods')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }: { name: string, percent: number }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {paymentMethodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => [`€${value}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Lista Recente de Pagamentos */}
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('recentPayments')}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('history')}
              >
                Ver Todos
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.slice(0, 5).map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.cliente_nome ? (
                            <>
                              {payment.cliente_nome}
                              {payment.cliente_id_manual && (
                                <span className="text-gray-500 ml-1">(ID: {payment.cliente_id_manual})</span>
                              )}
                            </>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {
                            (() => {
                              try {
                                return format(parseISO(payment.data), 'dd/MM/yyyy')
                              } catch {
                                return payment.data
                              }
                            })()
                          }
                        </TableCell>
                        <TableCell>€{payment.valor.toLocaleString('pt-PT')}</TableCell>
                        <TableCell>{payment.tipo}</TableCell>
                        <TableCell className="max-w-xs truncate">{payment.descricao || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Histórico de Pagamentos */}
        <TabsContent value="history" className="space-y-6">
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('paymentHistory')}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsExportDialogOpen(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('export')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('refresh')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome, ID manual, descrição..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10">
                        <Calendar className="h-4 w-4 mr-2" />
                        Período
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Intervalo de Datas</h4>
                          <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                              <label htmlFor="startDate">De:</label>
                              <Input
                                id="startDate"
                                type="date"
                                className="col-span-2"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                              />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                              <label htmlFor="endDate">Até:</label>
                              <Input
                                id="endDate"
                                type="date"
                                className="col-span-2"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="w-[180px] h-10">
                      <SelectValue placeholder="Método de Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos os Métodos</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Multibanco">Multibanco</SelectItem>
                      <SelectItem value="MBWay">MBWay</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Tabela de Pagamentos */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:text-[#3f9094] whitespace-nowrap"
                        onClick={() => handleSort('cliente_nome')}
                      >
                        Cliente
                        {sortColumn === 'cliente_nome' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-[#3f9094] whitespace-nowrap"
                        onClick={() => handleSort('data')}
                      >
                        Data
                        {sortColumn === 'data' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-[#3f9094] whitespace-nowrap"
                        onClick={() => handleSort('valor')}
                      >
                        Valor
                        {sortColumn === 'valor' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:text-[#3f9094] whitespace-nowrap"
                        onClick={() => handleSort('tipo')}
                      >
                        Método
                        {sortColumn === 'tipo' && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPayments.length > 0 ? (
                      sortedPayments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                          {payment.cliente_nome ? (
                            <>
                              {payment.cliente_nome}
                              {payment.cliente_id_manual && (
                                <span className="text-gray-500 ml-1">(ID: {payment.cliente_id_manual})</span>
                              )}
                            </>
                          ) : '-'}
                        </TableCell>
                          <TableCell>
                            {
                              (() => {
                                try {
                                  return format(parseISO(payment.data), 'dd/MM/yyyy')
                                } catch {
                                  return payment.data
                                }
                              })()
                            }
                          </TableCell>
                          <TableCell>€{payment.valor.toLocaleString('pt-PT')}</TableCell>
                          <TableCell>{payment.tipo}</TableCell>
                          <TableCell className="max-w-xs truncate">{payment.descricao || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center p-4">
                          Nenhum pagamento encontrado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {sortedPayments.length > 0 && (
                <div className="text-sm text-muted-foreground mt-4">
                  Mostrando {sortedPayments.length} de {payments.length} pagamentos
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Gráficos Detalhados */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>{t('topClients')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topClients}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <RechartsTooltip
                        formatter={(value: any) => [`€${value}`, 'Receita Total']}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#3f9094" 
                        radius={[0, 4, 4, 0]}
                        label={{ 
                          position: 'right', 
                          formatter: (value: any) => `€${value}`,
                          fill: '#666',
                          fontSize: 12 
                        }}
                      />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dialog de Exportação */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Relatório Financeiro</DialogTitle>
            <DialogDescription>
              Escolha o formato do relatório financeiro para exportação.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>O relatório incluirá todos os {sortedPayments.length} pagamentos exibidos com os filtros atuais.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                {t('export')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de ajuda para criar tabela */}
      <Dialog open={showTableHelpDialog} onOpenChange={setShowTableHelpDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuração da Tabela de Pagamentos</DialogTitle>
            <DialogDescription>
              É necessário configurar a tabela de pagamentos no banco de dados para usar esta funcionalidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm">
              Parece que a tabela <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">pagamentos</code> não existe no seu banco de dados Supabase. Siga estas instruções para criá-la:
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">1. Acesse o Painel do Supabase</h4>
              <p className="text-sm">Entre no painel do Supabase e navegue até o projeto utilizado nesta aplicação.</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">2. Abra o Editor SQL</h4>
              <p className="text-sm">No menu lateral, clique em "Table Editor" e depois em "SQL Editor".</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">3. Execute o SQL para criar a tabela</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                <pre className="text-xs">
{`CREATE TABLE public.pagamentos (
  id SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  valor DECIMAL(10, 2) NOT NULL,
  data DATE NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas de segurança
CREATE POLICY "Permitir acesso a pagamentos para usuários autenticados"
  ON public.pagamentos
  USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.pagamentos IS 'Tabela de pagamentos de clientes';`}
                </pre>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">4. Atualize esta página</h4>
              <p className="text-sm">Após criar a tabela, atualize esta página para começar a usar os recursos financeiros.</p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowTableHelpDialog(false)}
              >
                Entendi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialReport;
