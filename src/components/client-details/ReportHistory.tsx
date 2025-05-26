import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, Trash2, FileText, File, Search, FilterIcon } from 'lucide-react';
import { ClientDetailData } from '@/types/client';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ReportHistoryProps {
  client: ClientDetailData;
}

type ReportType = 'completo' | 'financeiro' | 'progresso' | 'sessoes';
type ReportFormat = 'pdf' | 'txt';

interface HistoricalReport {
  id: string;
  title: string;
  type: ReportType;
  format: ReportFormat;
  date: Date;
  fileSize: number;
  previewText?: string;
}

const ReportHistory = ({ client }: ReportHistoryProps) => {
  // Exemplo de dados históricos
  const initialReports: HistoricalReport[] = [
    {
      id: '1',
      title: 'Relatório Completo',
      type: 'completo',
      format: 'pdf',
      date: parseISO('2023-06-15'),
      fileSize: 345600,
      previewText: 'Lorem ipsum dolor sit amet...'
    },
    {
      id: '2',
      title: 'Relatório Financeiro',
      type: 'financeiro',
      format: 'pdf',
      date: parseISO('2023-07-20'),
      fileSize: 128000,
      previewText: 'Lorem ipsum dolor sit amet...'
    },
    {
      id: '3',
      title: 'Progresso Mensal',
      type: 'progresso',
      format: 'txt',
      date: parseISO('2023-08-05'),
      fileSize: 45056,
      previewText: 'Lorem ipsum dolor sit amet...'
    },
  ];

  const [reports, setReports] = useState<HistoricalReport[]>(initialReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined);
  const [selectedReport, setSelectedReport] = useState<HistoricalReport | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Filtrar relatórios com base nos critérios selecionados
  const filteredReports = reports.filter(report => {
    // Filtro de texto
    if (searchTerm && !report.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro de tipo
    if (typeFilter !== 'all' && report.type !== typeFilter) {
      return false;
    }
    
    // Filtro de formato
    if (formatFilter !== 'all' && report.format !== formatFilter) {
      return false;
    }
    
    // Filtro de data de início
    if (dateRangeStart && isBefore(report.date, dateRangeStart)) {
      return false;
    }
    
    // Filtro de data de fim
    if (dateRangeEnd && isAfter(report.date, dateRangeEnd)) {
      return false;
    }
    
    return true;
  });
  
  // Função para excluir um relatório
  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(report => report.id !== id));
  };
  
  // Abrir visualização do relatório
  const openPreview = (report: HistoricalReport) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };
  
  // Formatar o tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Obter ícone com base no formato
  const getFormatIcon = (format: ReportFormat) => {
    switch (format) {
      case 'pdf':
        return <File className="h-4 w-4" />;
      case 'txt':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  // Obter nome do tipo em português
  const getTypeName = (type: ReportType): string => {
    const typeNames: Record<ReportType, string> = {
      completo: 'Relatório Completo',
      financeiro: 'Relatório Financeiro',
      progresso: 'Relatório de Progresso',
      sessoes: 'Histórico de Sessões'
    };
    return typeNames[type];
  };
  
  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setFormatFilter('all');
    setDateRangeStart(undefined);
    setDateRangeEnd(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg border border-white/20">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">Filtros</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-gray-700"
            onClick={clearFilters}
          >
            Limpar filtros
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar por título..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="type-filter">Tipo</Label>
            <Select 
              value={typeFilter} 
              onValueChange={setTypeFilter}
            >
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="completo">Relatório Completo</SelectItem>
                <SelectItem value="financeiro">Relatório Financeiro</SelectItem>
                <SelectItem value="progresso">Relatório de Progresso</SelectItem>
                <SelectItem value="sessoes">Histórico de Sessões</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="format-filter">Formato</Label>
            <Select 
              value={formatFilter} 
              onValueChange={setFormatFilter}
            >
              <SelectTrigger id="format-filter">
                <SelectValue placeholder="Todos os formatos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os formatos</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="txt">Texto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label>Período</Label>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-sm truncate flex-1 justify-start"
                  >
                    {dateRangeStart ? format(dateRangeStart, 'dd/MM/yy') : 'De'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRangeStart}
                    onSelect={setDateRangeStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span>-</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-sm truncate flex-1 justify-start"
                  >
                    {dateRangeEnd ? format(dateRangeEnd, 'dd/MM/yy') : 'Até'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRangeEnd}
                    onSelect={setDateRangeEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lista de relatórios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Relatórios Gerados ({filteredReports.length})
          </h3>
        </div>
        
        {filteredReports.length > 0 ? (
          <div className="grid gap-3">
            {filteredReports.map(report => (
              <div 
                key={report.id} 
                className="p-4 rounded-lg border border-gray-200 bg-white/30 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-md ${
                      report.format === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {getFormatIcon(report.format)}
                    </div>
                    <div>
                      <h4 className="font-medium">{report.title}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                        <span>{format(report.date, 'dd/MM/yyyy')}</span>
                        <span>{getTypeName(report.type)}</span>
                        <span>{report.format.toUpperCase()}</span>
                        <span>{formatFileSize(report.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-blue-600"
                      onClick={() => openPreview(report)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-green-600"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-600"
                      onClick={() => deleteReport(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-lg bg-gray-50">
            <p className="text-gray-500">Nenhum relatório encontrado</p>
            {(searchTerm || typeFilter !== 'all' || formatFilter !== 'all' || dateRangeStart || dateRangeEnd) && (
              <Button 
                variant="link" 
                className="mt-2 text-[#3f9094]"
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Modal de visualização */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && (
                <>
                  {getFormatIcon(selectedReport.format)}
                  <span>{selectedReport.title}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedReport && (
                <>
                  Gerado em {format(selectedReport.date, 'dd/MM/yyyy')} • {formatFileSize(selectedReport.fileSize)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="h-96 overflow-y-auto p-4 border rounded-md bg-gray-50 font-mono text-sm whitespace-pre-wrap">
            {selectedReport?.previewText || 'Sem conteúdo para visualização'}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
            <Button className="bg-[#3f9094] hover:bg-[#265255]">
              <Download className="h-4 w-4 mr-2" />
              <span>Baixar</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportHistory; 