import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientDetailData, Session, Payment } from '@/types/client';
import { format, parseISO, isValid, subMonths, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

interface ClientChartsProps {
  client: ClientDetailData;
  sessions: Session[];
  payments: Payment[];
}

const COLORS = ['#3f9094', '#9e50b3', '#1088c4', '#ecc249', '#f86b3f', '#8884d8'];

const ClientCharts = ({ client, sessions, payments }: ClientChartsProps) => {
  const [chartType, setChartType] = useState<'sessoes' | 'pagamentos' | 'financeiro' | 'evolucao'>('sessoes');

  // Função segura para formatar datas
  const formatDateSafe = (dateStr: string | undefined | null) => {
    if (!dateStr) return null;
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return null;
      return date;
    } catch (error) {
      console.error('Erro ao formatar data:', dateStr, error);
      return null;
    }
  };

  // Dados para o gráfico de sessões por mês
  const prepareSessionsData = () => {
    // Organizar sessões por mês
    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
    
    const monthlyData = last6Months.map(month => {
      const monthStr = format(month, 'MMM yyyy', { locale: ptBR });
      const shortMonthStr = format(month, 'MMM', { locale: ptBR });
      const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Contar sessões deste mês
      const monthSessions = sessions.filter(session => {
        const sessionDate = formatDateSafe(session.date);
        return sessionDate && 
          isAfter(sessionDate, firstDayOfMonth) && 
          !isAfter(sessionDate, lastDayOfMonth);
      });
      
      return {
        name: monthStr,
        shortName: shortMonthStr,
        sessoesRealizadas: monthSessions.filter(s => s.status === 'confirmado').length,
        sessoesTotal: monthSessions.length
      };
    }).reverse(); // Mostrar ordem cronológica
    
    return monthlyData;
  };
  
  // Dados para o gráfico de pagamentos
  const preparePaymentsData = () => {
    // Agrupar pagamentos por tipo
    const paymentByType: Record<string, number> = {};
    
    payments.forEach(payment => {
      const type = payment.tipo || 'Não especificado';
      paymentByType[type] = (paymentByType[type] || 0) + (payment.valor || 0);
    });
    
    return Object.entries(paymentByType).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  };
  
  // Dados para o gráfico financeiro (mensal)
  const prepareFinancialData = () => {
    // Organizar pagamentos por mês
    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
    
    const monthlyData = last6Months.map(month => {
      const monthStr = format(month, 'MMM yyyy', { locale: ptBR });
      const shortMonthStr = format(month, 'MMM', { locale: ptBR });
      const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      // Calcular pagamentos deste mês
      const monthPayments = payments.filter(payment => {
        const paymentDate = formatDateSafe(payment.data);
        return paymentDate && 
          isAfter(paymentDate, firstDayOfMonth) && 
          !isAfter(paymentDate, lastDayOfMonth);
      });
      
      const totalAmount = monthPayments.reduce((sum, p) => sum + (p.valor || 0), 0);
      
      return {
        name: monthStr,
        shortName: shortMonthStr,
        valor: Number(totalAmount.toFixed(2))
      };
    }).reverse(); // Mostrar ordem cronológica
    
    return monthlyData;
  };
  
  // Renderização dos diferentes tipos de gráficos
  const renderChart = () => {
    switch (chartType) {
      case 'sessoes':
        const sessionsData = prepareSessionsData();
        return (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sessionsData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-15} 
                  textAnchor="end" 
                  height={60}
                  tick={{fontSize: 12}}
                  tickFormatter={(value, index) => {
                    // Em telas pequenas, usar o nome do mês abreviado
                    return window.innerWidth < 640 ? sessionsData[index].shortName : value;
                  }}
                />
                <YAxis allowDecimals={false} tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => [`${value} sessões`, '']} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="sessoesRealizadas" name="Realizadas" fill="#3f9094" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sessoesTotal" name="Total" fill="#ecc249" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'pagamentos':
        const paymentsData = preparePaymentsData();
        return (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={window.innerWidth < 640 ? 70 : 90}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => 
                    window.innerWidth < 640 ? 
                      `${(percent * 100).toFixed(0)}%` : 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {paymentsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`€${value}`, '']} />
                <Legend verticalAlign="bottom" height={50} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'financeiro':
        const financialData = prepareFinancialData();
        return (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={financialData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-15} 
                  textAnchor="end" 
                  height={60}
                  tick={{fontSize: 12}}
                  tickFormatter={(value, index) => {
                    // Em telas pequenas, usar o nome do mês abreviado
                    return window.innerWidth < 640 ? financialData[index].shortName : value;
                  }}
                />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => [`€${value}`, 'Valor']} />
                <Area type="monotone" dataKey="valor" stroke="#3f9094" fill="#3f9094" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'evolucao':
        // Taxa de conclusão ao longo do tempo
        const totalSessions = sessions.length;
        const realizadas = sessions.filter(s => s.status === 'confirmado').length;
        const completionRate = client.max_sessoes && client.max_sessoes > 0 ? 
          (realizadas / client.max_sessoes) * 100 : 0;
        
        // Simplificado para exibir apenas o progresso atual
        const progressData = [
          { name: 'Progresso', valor: Number(completionRate.toFixed(0)), meta: 100 }
        ];
        
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={progressData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{fontSize: 12}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 12}} />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Bar dataKey="valor" fill="#3f9094" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-center max-w-md">
              <h3 className="font-medium mb-2">Progresso do Cliente</h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="text-center w-full sm:w-auto">
                  <div className="text-2xl sm:text-3xl font-bold">{realizadas}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Sessões realizadas</div>
                </div>
                <div className="text-center w-full sm:w-auto">
                  <div className="text-2xl sm:text-3xl font-bold">{client.max_sessoes || '?'}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Sessões planeadas</div>
                </div>
                <div className="text-center w-full sm:w-auto">
                  <div className="text-2xl sm:text-3xl font-bold text-[#3f9094]">{completionRate.toFixed(0)}%</div>
                  <div className="text-xs sm:text-sm text-gray-500">Taxa de conclusão</div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Selecione um tipo de gráfico</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button
            onClick={() => setChartType('sessoes')}
            className={`px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-md ${
              chartType === 'sessoes' 
                ? 'bg-[#3f9094] text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Sessões
          </button>
          <button
            onClick={() => setChartType('pagamentos')}
            className={`px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-md ${
              chartType === 'pagamentos' 
                ? 'bg-[#3f9094] text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Tipos de Pagamento
          </button>
          <button
            onClick={() => setChartType('financeiro')}
            className={`px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-md ${
              chartType === 'financeiro' 
                ? 'bg-[#3f9094] text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Financeiro Mensal
          </button>
          <button
            onClick={() => setChartType('evolucao')}
            className={`px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-md ${
              chartType === 'evolucao' 
                ? 'bg-[#3f9094] text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Evolução
          </button>
        </div>
      </div>
      
      <div className="bg-white/30 backdrop-blur-sm p-2 sm:p-4 rounded-lg border border-white/20">
        {renderChart()}
      </div>
    </div>
  );
};

export default ClientCharts; 