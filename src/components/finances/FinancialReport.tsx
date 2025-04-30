
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample financial data
const financialData = [
  {
    month: 'Jan',
    neurofeedback: 2500,
    assessments: 800,
    consultations: 400
  },
  {
    month: 'Fev',
    neurofeedback: 3000,
    assessments: 1200,
    consultations: 600
  },
  {
    month: 'Mar',
    neurofeedback: 3200,
    assessments: 900,
    consultations: 500
  },
  {
    month: 'Abr',
    neurofeedback: 3700,
    assessments: 1500,
    consultations: 700
  }
];

const FinancialReport = () => {
  // Calculate totals
  const totals = financialData.reduce(
    (acc, curr) => {
      acc.neurofeedback += curr.neurofeedback;
      acc.assessments += curr.assessments;
      acc.consultations += curr.consultations;
      return acc;
    },
    { neurofeedback: 0, assessments: 0, consultations: 0 }
  );
  
  const total = totals.neurofeedback + totals.assessments + totals.consultations;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glassmorphism">
          <CardHeader className="pb-2">
            <p className="text-sm text-neuro-gray">Sessões de Neurofeedback</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.neurofeedback.toLocaleString()}</div>
            <p className="text-xs text-neuro-gray mt-1">
              {((totals.neurofeedback / total) * 100).toFixed(1)}% da receita total
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
              {((totals.assessments / total) * 100).toFixed(1)}% da receita total
            </p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader className="pb-2">
            <p className="text-sm text-neuro-gray">Consultas</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totals.consultations.toLocaleString()}</div>
            <p className="text-xs text-neuro-gray mt-1">
              {((totals.consultations / total) * 100).toFixed(1)}% da receita total
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
                />
                <Legend />
                <Bar dataKey="neurofeedback" name="Neurofeedback" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="assessments" name="Avaliações" fill="#FFDEE2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consultations" name="Consultas" fill="#D3E4FD" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;
