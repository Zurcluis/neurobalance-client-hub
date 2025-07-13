import React, { useState, useEffect } from 'react';
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
  Loader2,
  Download,
  Info,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface ClientPaymentsProps {
  clientId: number;
}

interface Payment {
  id: number;
  valor: number;
  data: string;
  tipo: string;
  descricao: string;
  criado_em: string;
}

const ClientPayments: React.FC<ClientPaymentsProps> = ({ clientId }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('all');

  useEffect(() => {
    fetchPayments();
  }, [clientId]);

  const fetchPayments = async () => {
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
    } catch (error: any) {
      console.error('Erro ao carregar pagamentos:', error);
      setError(error.message);
      toast.error('Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPayments = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'month':
        return payments.filter(payment => {
          const paymentDate = parseISO(payment.data);
          return paymentDate >= startOfMonth(now) && paymentDate <= endOfMonth(now);
        });
      case 'year':
        return payments.filter(payment => {
          const paymentDate = parseISO(payment.data);
          return paymentDate >= startOfYear(now) && paymentDate <= endOfYear(now);
        });
      default:
        return payments;
    }
  };

  const getPaymentStats = () => {
    const filteredPayments = getFilteredPayments();
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.valor, 0);
    const averageAmount = filteredPayments.length > 0 ? totalAmount / filteredPayments.length : 0;
    
    return {
      totalAmount,
      averageAmount,
      totalPayments: filteredPayments.length,
      lastPayment: filteredPayments[0]
    };
  };

  const getPaymentMethodData = () => {
    const filteredPayments = getFilteredPayments();
    const methodCounts = filteredPayments.reduce((acc, payment) => {
      acc[payment.tipo] = (acc[payment.tipo] || 0) + payment.valor;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methodCounts).map(([method, amount]) => ({
      name: method,
      value: amount,
      count: filteredPayments.filter(p => p.tipo === method).length
    }));
  };

  const getMonthlyData = () => {
    const monthlyData: Record<string, number> = {};
    
    payments.forEach(payment => {
      const monthKey = format(parseISO(payment.data), 'MMM yyyy', { locale: ptBR });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + payment.valor;
    });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-12); // Últimos 12 meses
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'multibanco': return 'bg-blue-100 text-blue-800';
      case 'mbway': return 'bg-green-100 text-green-800';
      case 'transferencia': return 'bg-purple-100 text-purple-800';
      case 'dinheiro': return 'bg-yellow-100 text-yellow-800';
      case 'cartao': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getPaymentStats();
  const paymentMethodData = getPaymentMethodData();
  const monthlyData = getMonthlyData();
  const filteredPayments = getFilteredPayments();

  const COLORS = ['#3f9094', '#5DA399', '#8AC1BB', '#B1D4CF', '#E6F3F2'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#3f9094]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Visualize seus pagamentos e histórico financeiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
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

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <Euro className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              €{stats.totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {selectedPeriod === 'month' ? 'Neste mês' : 
               selectedPeriod === 'year' ? 'Neste ano' : 'Total geral'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalPayments}
            </div>
            <p className="text-xs text-gray-600">
              Número de transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              €{stats.averageAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              Por pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Pagamento</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">
              {stats.lastPayment ? 
                format(parseISO(stats.lastPayment.data), 'dd/MM/yyyy', { locale: ptBR }) :
                'Nenhum'
              }
            </div>
            <p className="text-xs text-gray-600">
              {stats.lastPayment ? `€${stats.lastPayment.valor.toFixed(2)}` : 'pagamento'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>Pagamentos nos últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Valor']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3f9094" 
                    strokeWidth={2}
                    dot={{ fill: '#3f9094' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Métodos de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>Distribuição por tipo de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Valor Total']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detalhes dos Pagamentos</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum pagamento encontrado</p>
              <p className="text-sm">
                {selectedPeriod === 'month' ? 'Neste mês' : 
                 selectedPeriod === 'year' ? 'Neste ano' : 'No período selecionado'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{payment.descricao}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(parseISO(payment.data), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                        <Badge className={getPaymentTypeColor(payment.tipo)}>
                          {payment.tipo}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      €{payment.valor.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(parseISO(payment.criado_em), 'HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações Importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Todos os pagamentos são processados de forma segura e criptografada</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Recibos e faturas são enviados automaticamente por email</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Para questões sobre pagamentos, entre em contacto através do chat ou telefone</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p>Mantenha seus dados de pagamento sempre atualizados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPayments; 