import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MarketingCampaign, ExportOptions, MESES } from '@/types/marketing';
import { Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportManagerProps {
  campaigns: MarketingCampaign[];
}

const ExportManager: React.FC<ExportManagerProps> = ({ campaigns }) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    formato: 'pdf',
    periodo: {
      mesInicio: new Date().getMonth() + 1,
      anoInicio: new Date().getFullYear(),
      mesFim: new Date().getMonth() + 1,
      anoFim: new Date().getFullYear(),
    },
    incluirGraficos: true,
    incluirComparacoes: true,
  });
  
  const [isExporting, setIsExporting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const updateExportOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updatePeriod = (key: keyof ExportOptions['periodo'], value: number) => {
    setExportOptions(prev => ({
      ...prev,
      periodo: {
        ...prev.periodo,
        [key]: value
      }
    }));
  };

  const filterCampaignsByPeriod = () => {
    return campaigns.filter(campaign => {
      const campaignDate = new Date(campaign.ano, campaign.mes - 1);
      const startDate = new Date(exportOptions.periodo.anoInicio, exportOptions.periodo.mesInicio - 1);
      const endDate = new Date(exportOptions.periodo.anoFim, exportOptions.periodo.mesFim - 1);
      
      return campaignDate >= startDate && campaignDate <= endDate;
    });
  };

  const calculateMetrics = (campaignList: MarketingCampaign[]) => {
    if (campaignList.length === 0) return null;

    const totals = campaignList.reduce((acc, campaign) => ({
      totalInvestimento: acc.totalInvestimento + campaign.investimento,
      totalLeads: acc.totalLeads + campaign.leads,
      totalReunioes: acc.totalReunioes + campaign.reunioes,
      totalVendas: acc.totalVendas + campaign.vendas,
      totalReceita: acc.totalReceita + campaign.receita,
    }), {
      totalInvestimento: 0,
      totalLeads: 0,
      totalReunioes: 0,
      totalVendas: 0,
      totalReceita: 0,
    });

    const cplMedio = totals.totalLeads > 0 ? totals.totalInvestimento / totals.totalLeads : 0;
    const cacMedio = totals.totalVendas > 0 ? totals.totalInvestimento / totals.totalVendas : 0;
    const taxaConversaoMedia = totals.totalLeads > 0 ? (totals.totalVendas / totals.totalLeads) * 100 : 0;
    const roi = totals.totalInvestimento > 0 ? ((totals.totalReceita - totals.totalInvestimento) / totals.totalInvestimento) * 100 : 0;
    const roas = totals.totalInvestimento > 0 ? totals.totalReceita / totals.totalInvestimento : 0;

    return {
      ...totals,
      cplMedio: Math.round(cplMedio * 100) / 100,
      cacMedio: Math.round(cacMedio * 100) / 100,
      taxaConversaoMedia: Math.round(taxaConversaoMedia * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      roas: Math.round(roas * 100) / 100
    };
  };

  const exportToPDF = async (filteredCampaigns: MarketingCampaign[]) => {
    const doc = new jsPDF();
    const metrics = calculateMetrics(filteredCampaigns);

    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Relatório de Campanhas de Marketing', 20, 20);
    
    doc.setFontSize(12);
    const mesInicio = MESES.find(m => m.valor === exportOptions.periodo.mesInicio)?.nome || '';
    const mesFim = MESES.find(m => m.valor === exportOptions.periodo.mesFim)?.nome || '';
    doc.text(`Período: ${mesInicio} ${exportOptions.periodo.anoInicio} - ${mesFim} ${exportOptions.periodo.anoFim}`, 20, 30);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, 20, 40);

    // Resumo de Métricas
    if (metrics) {
      doc.setFontSize(14);
      doc.text('Resumo Geral', 20, 60);
      
      const metricsData = [
        ['Total Investido', `€${metrics.totalInvestimento.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`],
        ['Total Receita', `€${metrics.totalReceita.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`],
        ['Total Leads', metrics.totalLeads.toString()],
        ['Total Vendas', metrics.totalVendas.toString()],
        ['CPL Médio', `€${metrics.cplMedio.toFixed(2)}`],
        ['CAC Médio', `€${metrics.cacMedio.toFixed(2)}`],
        ['Taxa Conversão', `${metrics.taxaConversaoMedia.toFixed(1)}%`],
        ['ROI', `${metrics.roi.toFixed(1)}%`],
        ['ROAS', `${metrics.roas.toFixed(2)}x`]
      ];

      doc.autoTable({
        startY: 70,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 }
      });
    }

    // Tabela de Campanhas
    doc.setFontSize(14);
    doc.text('Detalhes das Campanhas', 20, doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 120);

    const campaignData = filteredCampaigns.map(campaign => [
      campaign.name,
      campaign.origem,
      `${MESES.find(m => m.valor === campaign.mes)?.nome} ${campaign.ano}`,
      `€${campaign.investimento.toFixed(2)}`,
      campaign.leads.toString(),
      campaign.vendas.toString(),
      `€${campaign.receita.toFixed(2)}`,
      `${campaign.taxa_conversao.toFixed(1)}%`,
      `€${campaign.cpl.toFixed(2)}`,
      `€${campaign.cac.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 30 : 130,
      head: [['Campanha', 'Origem', 'Período', 'Investimento', 'Leads', 'Vendas', 'Receita', 'Conv.', 'CPL', 'CAC']],
      body: campaignData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18 },
        4: { cellWidth: 12 },
        5: { cellWidth: 12 },
        6: { cellWidth: 18 },
        7: { cellWidth: 12 },
        8: { cellWidth: 15 },
        9: { cellWidth: 15 }
      }
    });

    // Salvar PDF
    const fileName = `relatorio-marketing-${mesInicio}-${exportOptions.periodo.anoInicio}-${mesFim}-${exportOptions.periodo.anoFim}.pdf`;
    doc.save(fileName);
  };

  const exportToCSV = (filteredCampaigns: MarketingCampaign[]) => {
    const headers = [
      'Nome da Campanha',
      'Origem',
      'Mês',
      'Ano',
      'Investimento (€)',
      'Leads',
      'Reuniões',
      'Vendas',
      'Receita (€)',
      'CPL (€)',
      'CAC (€)',
      'Taxa Conversão (%)',
      'ROI (%)',
      'ROAS'
    ];

    const csvData = filteredCampaigns.map(campaign => {
      const roi = campaign.investimento > 0 ? ((campaign.receita - campaign.investimento) / campaign.investimento) * 100 : 0;
      const roas = campaign.investimento > 0 ? campaign.receita / campaign.investimento : 0;
      
      return [
        campaign.name,
        campaign.origem,
        campaign.mes,
        campaign.ano,
        campaign.investimento.toFixed(2),
        campaign.leads,
        campaign.reunioes,
        campaign.vendas,
        campaign.receita.toFixed(2),
        campaign.cpl.toFixed(2),
        campaign.cac.toFixed(2),
        campaign.taxa_conversao.toFixed(1),
        roi.toFixed(1),
        roas.toFixed(2)
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const mesInicio = MESES.find(m => m.valor === exportOptions.periodo.mesInicio)?.nome || '';
    const mesFim = MESES.find(m => m.valor === exportOptions.periodo.mesFim)?.nome || '';
    const fileName = `relatorio-marketing-${mesInicio}-${exportOptions.periodo.anoInicio}-${mesFim}-${exportOptions.periodo.anoFim}.csv`;
    
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filteredCampaigns = filterCampaignsByPeriod();
      
      if (filteredCampaigns.length === 0) {
        toast.error('Nenhuma campanha encontrada no período selecionado.');
        return;
      }

      if (exportOptions.formato === 'pdf') {
        await exportToPDF(filteredCampaigns);
        toast.success('Relatório PDF exportado com sucesso!');
      } else {
        exportToCSV(filteredCampaigns);
        toast.success('Dados CSV exportados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCount = filterCampaignsByPeriod().length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formato de Exportação */}
        <div className="space-y-2">
          <Label>Formato de Exportação</Label>
          <Select
            value={exportOptions.formato}
            onValueChange={(value: 'pdf' | 'csv') => updateExportOption('formato', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF - Relatório Completo
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV - Dados Brutos
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Período */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Período de Exportação
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Data Início</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={exportOptions.periodo.mesInicio.toString()}
                  onValueChange={(value) => updatePeriod('mesInicio', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((mes) => (
                      <SelectItem key={mes.valor} value={mes.valor.toString()}>
                        {mes.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={exportOptions.periodo.anoInicio.toString()}
                  onValueChange={(value) => updatePeriod('anoInicio', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-600">Data Fim</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={exportOptions.periodo.mesFim.toString()}
                  onValueChange={(value) => updatePeriod('mesFim', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((mes) => (
                      <SelectItem key={mes.valor} value={mes.valor.toString()}>
                        {mes.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={exportOptions.periodo.anoFim.toString()}
                  onValueChange={(value) => updatePeriod('anoFim', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Opções Adicionais (apenas para PDF) */}
        {exportOptions.formato === 'pdf' && (
          <div className="space-y-3">
            <Label>Opções Adicionais</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluirGraficos"
                  checked={exportOptions.incluirGraficos}
                  onCheckedChange={(checked) => updateExportOption('incluirGraficos', checked)}
                />
                <Label htmlFor="incluirGraficos" className="text-sm">
                  Incluir gráficos no relatório
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluirComparacoes"
                  checked={exportOptions.incluirComparacoes}
                  onCheckedChange={(checked) => updateExportOption('incluirComparacoes', checked)}
                />
                <Label htmlFor="incluirComparacoes" className="text-sm">
                  Incluir comparações com período anterior
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>{filteredCount} campanhas</strong> serão incluídas no relatório do período selecionado.
          </p>
        </div>

        {/* Botão de Exportação */}
        <Button
          onClick={handleExport}
          disabled={isExporting || filteredCount === 0}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : `Exportar ${exportOptions.formato.toUpperCase()}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExportManager;
