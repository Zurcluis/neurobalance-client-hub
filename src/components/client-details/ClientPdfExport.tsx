import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ClientDetailData, Session, Payment } from '@/types/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Adicionar tipagem para a biblioteca jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

interface ClientPdfExportProps {
  client: ClientDetailData;
  sessions?: Session[];
  payments?: Payment[];
}

const ClientPdfExport: React.FC<ClientPdfExportProps> = ({ client, sessions = [], payments = [] }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Não informado';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
      }
      return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const generatePdf = async () => {
    try {
      setIsGenerating(true);
      
      // Obter sessões e pagamentos do localStorage se não foram passados como props
      let clientSessions = sessions;
      let clientPayments = payments;
      
      if (sessions.length === 0) {
        const storedSessions = localStorage.getItem('sessions');
        if (storedSessions) {
          const allSessions = JSON.parse(storedSessions);
          clientSessions = allSessions.filter((session: Session) => 
            session.clientId === client.id?.toString()
          );
        }
      }
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Título
      doc.setFontSize(20);
      doc.setTextColor(58, 114, 109); // Cor primária do NeuroBalance
      doc.text('Relatório do Cliente', pageWidth / 2, 20, { align: 'center' });
      
      // Informações do cliente
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Dados Pessoais', 14, 35);
      
      doc.setFontSize(12);
      doc.text(`Nome: ${client.nome}`, 14, 45);
      doc.text(`Email: ${client.email}`, 14, 52);
      doc.text(`Telefone: ${client.telefone}`, 14, 59);
      doc.text(`Data de Nascimento: ${formatDate(client.data_nascimento)}`, 14, 66);
      doc.text(`Gênero: ${client.genero}`, 14, 73);
      doc.text(`Morada: ${client.morada}`, 14, 80);
      
      // Status e outras informações
      doc.setFontSize(16);
      doc.text('Status do Cliente', 14, 95);
      
      doc.setFontSize(12);
      doc.text(`Estado: ${client.estado}`, 14, 105);
      doc.text(`Tipo de Contato: ${client.tipo_contato}`, 14, 112);
      doc.text(`Como Conheceu: ${client.como_conheceu}`, 14, 119);
      doc.text(`Número de Sessões: ${client.numero_sessoes || 0}`, 14, 126);
      doc.text(`Total Pago: €${client.total_pago?.toFixed(2) || '0.00'}`, 14, 133);
      
      // Tabela de Sessões
      if (clientSessions.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(58, 114, 109);
        doc.text('Histórico de Sessões', pageWidth / 2, 20, { align: 'center' });
        
        const sessionsTableData = clientSessions.map(session => [
          formatDate(session.date),
          session.type || 'N/A',
          session.paid ? 'Sim' : 'Não',
          session.notes || ''
        ]);
        
        doc.autoTable({
          head: [['Data', 'Tipo', 'Pago', 'Notas']],
          body: sessionsTableData,
          startY: 30,
          theme: 'grid',
          headStyles: { fillColor: [58, 114, 109] }
        });
      }
      
      // Tabela de Pagamentos
      if (clientPayments.length > 0) {
        let finalY = 0;
        // @ts-ignore
        if (doc.lastAutoTable) {
          // @ts-ignore
          finalY = doc.lastAutoTable.finalY;
        }
        
        if (clientSessions.length === 0) {
          doc.addPage();
        } else if (finalY > 200) {
          doc.addPage();
          finalY = 0;
        }
        
        doc.setFontSize(16);
        doc.setTextColor(58, 114, 109);
        doc.text('Histórico de Pagamentos', pageWidth / 2, finalY ? finalY + 20 : 20, { align: 'center' });
        
        const paymentsTableData = clientPayments.map(payment => [
          formatDate(payment.data),
          `€${payment.valor.toFixed(2)}`,
          payment.tipo,
          payment.descricao || ''
        ]);
        
        doc.autoTable({
          head: [['Data', 'Valor', 'Tipo', 'Descrição']],
          body: paymentsTableData,
          startY: finalY ? finalY + 30 : 30,
          theme: 'grid',
          headStyles: { fillColor: [58, 114, 109] }
        });
      }
      
      // Notas
      if (client.notas) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(58, 114, 109);
        doc.text('Notas do Cliente', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        
        const splitText = doc.splitTextToSize(client.notas, pageWidth - 30);
        doc.text(splitText, 14, 30);
      }
      
      // Rodapé com data de geração
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const today = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        doc.text(`Relatório gerado em ${today}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10);
      }
      
      // Nome do arquivo
      const fileName = `cliente_${client.nome.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
      
      // Salvar o PDF
      doc.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Button 
      onClick={generatePdf} 
      className="bg-[#3A726D] hover:bg-[#265255]"
      disabled={isGenerating}
    >
      <Download className="h-4 w-4 mr-2" />
      {isGenerating ? 'Gerando...' : 'Exportar PDF'}
    </Button>
  );
};

export default ClientPdfExport; 