
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Payment } from '@/types/client';

const FinancialReport = () => {
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [totals, setTotals] = useState({
    neurofeedback: 0,
    assessments: 0,
    consultations: 0,
    monthly: 0
  });
  
  useEffect(() => {
    // Load all payments from localStorage
    const loadPayments = (): Payment[] => {
      const storedPayments = localStorage.getItem('payments');
      return storedPayments ? JSON.parse(storedPayments) : [];
    };
    
    const payments = loadPayments();
    
    // Group payments by month and categorize them
    const monthlyData = payments.reduce((acc: Record<string, any>, payment) => {
      const date = new Date(payment.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          month: getMonthName(date.getMonth()),
          neurofeedback: 0,
          assessments: 0,
          consultations: 0,
          monthly: 0,
        };
      }
      
      // Categorize payments based on description
      const description = payment.description.toLowerCase();
      if (description.includes('neurofeedback') && !description.includes('pack')) {
        acc[monthYear].neurofeedback += payment.amount;
      } else if (description.includes('avaliação')) {
        acc[monthYear].assessments += payment.amount;
      } else if (description.includes('pack')) {
        acc[monthYear].monthly += payment.amount;
      } else {
        acc[monthYear].consultations += payment.amount;
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by month/year
    const sortedData = Object.values(monthlyData).sort((a, b) => {
      const monthA = getMonthIndex(a.month);
      const monthB = getMonthIndex(b.month);
      return monthA - monthB;
    });
    
    setFinancialData(sortedData);
    
    // Calculate totals
    const calculatedTotals = {
      neurofeedback: payments.reduce((sum, payment) => {
        const desc = payment.description.toLowerCase();
        return desc.includes('neurofeedback') && !desc.includes('pack') ? sum + payment.amount : sum;
      }, 0),
      assessments: payments.reduce((sum, payment) => {
        const desc = payment.description.toLowerCase();
        return desc.includes('avaliação') ? sum + payment.amount : sum;
      }, 0),
      consultations: payments.reduce((sum, payment) => {
        const desc = payment.description.toLowerCase();
        return !desc.includes('neurofeedback') && !desc.includes('avaliação') && !desc.includes('pack') 
          ? sum + payment.amount : sum;
      }, 0),
      monthly: payments.reduce((sum, payment) => {
        const desc = payment.description.toLowerCase();
        return desc.includes('pack') ? sum + payment.amount : sum;
      }, 0)
    };
    
    setTotals(calculatedTotals);
  }, []);
  
  const getMonthName = (monthIndex: number): string => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[monthIndex];
  };
  
  const getMonthIndex = (monthName: string): number => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.indexOf(monthName);
  };
  
  const total = totals.neurofeedback + totals.assessments + totals.consultations + totals.monthly;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glassmorphism">
          <CardHeader className="pb-2">
            <p className="text-sm text-neuro-gray">Sessões de Neurofeedback</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.neurofeedback.toLocaleString()}</div>
            <p className="text-xs text-neuro-gray mt-1">
              {total ? ((totals.neurofeedback / total) * 100).toFixed(1) : '0'}% da receita total
            </p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader className="pb-2">
            <p className="text-sm text-neuro-gray">Avaliações</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.assessments.toLocaleString()}</div>
            <p className="text-xs text-neuro-gray mt-1">
              {total ? ((totals.assessments / total) * 100).toFixed(1) : '0'}% da receita total
            </p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader className="pb-2">
            <p className="text-sm text-neuro-gray">Pack Mensal</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.monthly.toLocaleString()}</div>
            <p className="text-xs text-neuro-gray mt-1">
              {total ? ((totals.monthly / total) * 100).toFixed(1) : '0'}% da receita total
            </p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader className="pb-2">
            <p className="text-sm text-neuro-gray">Outros</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.consultations.toLocaleString()}</div>
            <p className="text-xs text-neuro-gray mt-1">
              {total ? ((totals.consultations / total) * 100).toFixed(1) : '0'}% da receita total
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="glassmorphism">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Detalhe de Receitas</span>
          </CardTitle>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financialData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }} 
                  formatter={(value) => [`€${value}`, ``]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Legend formatter={(value) => {
                  switch(value) {
                    case "neurofeedback": return "Neurofeedback";
                    case "assessments": return "Avaliações";
                    case "monthly": return "Pack Mensal";
                    case "consultations": return "Outros";
                    default: return value;
                  }
                }} />
                <Bar dataKey="neurofeedback" name="neurofeedback" fill="#1088c4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="assessments" name="assessments" fill="#9e50b3" radius={[4, 4, 0, 0]} />
                <Bar dataKey="monthly" name="monthly" fill="#3f9094" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consultations" name="consultations" fill="#ecc249" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;
