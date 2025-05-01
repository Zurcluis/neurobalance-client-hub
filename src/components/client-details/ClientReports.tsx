
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientDetailData, Session, Payment } from '@/types/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';

interface ClientReportsProps {
  client: ClientDetailData;
  sessions: Session[];
  payments: Payment[];
}

const ClientReports = ({ client, sessions, payments }: ClientReportsProps) => {
  const [notes, setNotes] = useState<string>(client.notes || '');

  const handleSaveNotes = () => {
    // Update client notes in localStorage
    const clients = JSON.parse(localStorage.getItem('clients') || '[]');
    const updatedClients = clients.map((c: ClientDetailData) => {
      if (c.id === client.id) {
        return { ...c, notes: notes };
      }
      return c;
    });
    localStorage.setItem('clients', JSON.stringify(updatedClients));
    
    // Show toast or some feedback
    alert('Notas salvas com sucesso');
  };
  
  const generateProgressReport = () => {
    const totalSessions = sessions.length;
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const averagePerSession = totalSessions > 0 ? totalPaid / totalSessions : 0;
    const completionRate = client.maxSessions && client.maxSessions > 0 ? 
      (totalSessions / client.maxSessions) * 100 : 0;
    
    const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: ptBR });
    
    // Generate content for the report
    let content = `RELATÓRIO DE PROGRESSO DO CLIENTE\n\n`;
    content += `Data: ${currentDate}\n`;
    content += `Nome do Cliente: ${client.name}\n`;
    content += `Email: ${client.email}\n`;
    content += `Telefone: ${client.phone}\n`;
    content += client.birthday ? `Data de Nascimento: ${format(new Date(client.birthday), 'dd/MM/yyyy')}\n` : '';
    content += `\nRESUMO DE SESSÕES\n`;
    content += `Total de Sessões Realizadas: ${totalSessions}\n`;
    content += client.maxSessions ? `Sessões Planeadas: ${client.maxSessions}\n` : '';
    content += client.maxSessions ? `Taxa de Conclusão: ${completionRate.toFixed(1)}%\n` : '';
    content += `\nRESUMO FINANCEIRO\n`;
    content += `Total Pago: €${totalPaid.toFixed(2)}\n`;
    content += `Média por Sessão: €${averagePerSession.toFixed(2)}\n\n`;
    
    content += `NOTAS DO CLIENTE:\n${notes || 'Sem notas'}\n\n`;
    
    content += `DETALHES DAS SESSÕES:\n`;
    sessions.forEach((session, index) => {
      content += `\nSessão #${index + 1} - ${format(new Date(session.date), 'dd/MM/yyyy')}\n`;
      content += `${session.paid ? 'Pago' : 'Não Pago'}\n`;
      content += session.notes ? `Notas: ${session.notes}\n` : 'Sem notas\n';
    });
    
    content += `\nHISTÓRICO DE PAGAMENTOS:\n`;
    payments.forEach((payment) => {
      content += `\n${format(new Date(payment.date), 'dd/MM/yyyy')} - €${payment.amount.toFixed(2)}\n`;
      content += `${payment.description} (${payment.method})\n`;
    });
    
    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatório_${client.name}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span>Relatórios</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-white/30 backdrop-blur-sm p-6 rounded-lg border border-white/20">
            <h3 className="text-lg font-medium mb-2">Relatório de Progresso</h3>
            <p className="text-gray-700 mb-4">
              Gerar um relatório detalhado sobre o progresso do cliente, incluindo histórico de sessões, 
              pagamentos e estatísticas gerais.
            </p>
            <Button 
              onClick={generateProgressReport}
              className="bg-[#3f9094] hover:bg-[#265255] flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Baixar Relatório</span>
            </Button>
          </div>
          
          <div className="bg-white/30 backdrop-blur-sm p-6 rounded-lg border border-white/20">
            <h3 className="text-lg font-medium mb-4">Notas do Cliente</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione notas sobre o cliente aqui..."
              className="min-h-[150px] mb-4"
            />
            <Button 
              onClick={handleSaveNotes}
              className="bg-[#3f9094] hover:bg-[#265255]"
            >
              Salvar Notas
            </Button>
          </div>

          {sessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Resumo de Progresso</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#9e50b3]/10 p-4 rounded-lg">
                  <h4 className="text-xs text-[#9e50b3] font-medium mb-1">Sessões Realizadas</h4>
                  <p className="text-xl font-semibold">{sessions.length}</p>
                </div>
                <div className="bg-[#1088c4]/10 p-4 rounded-lg">
                  <h4 className="text-xs text-[#1088c4] font-medium mb-1">Total Pago</h4>
                  <p className="text-xl font-semibold">€{client.totalPaid?.toLocaleString()}</p>
                </div>
                <div className="bg-[#ecc249]/10 p-4 rounded-lg">
                  <h4 className="text-xs text-[#ecc249] font-medium mb-1">Próxima Sessão</h4>
                  <p className="text-sm font-medium">
                    {client.nextSession ? client.nextSession : "Não agendada"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientReports;
