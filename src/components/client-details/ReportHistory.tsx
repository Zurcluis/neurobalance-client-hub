import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, Trash2, FileText, File, Search } from 'lucide-react';
import { ClientDetailData } from '@/types/client';
import { format, isAfter, isBefore } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { readClientReports, deleteClientReport } from './reportHistoryStore';
import type { StoredReport, StoredReportType, StoredReportFormat } from './reportHistoryStore';
import { cn } from '@/lib/utils';

interface ReportHistoryProps {
  client: ClientDetailData;
}

const formatIcons: Record<StoredReportFormat, typeof File> = {
  pdf: File,
  txt: FileText
};

const formatTileStyles: Record<StoredReportFormat, string> = {
  pdf: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
  txt: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
};

const typeName: Record<StoredReportType, string> = {
  completo: 'Relatório Completo',
  financeiro: 'Relatório Financeiro',
  progresso: 'Relatório de Progresso',
  sessoes: 'Histórico de Sessões'
};

const formatFileSize = (bytes: number): string => {
  if (bytes <= 0) return '—';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const ReportHistory = ({ client }: ReportHistoryProps) => {
  const clientId = typeof client.id === 'number' ? client.id : 0;
  const [reports, setReports] = useState<StoredReport[]>(() => readClientReports(clientId));
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined);
  const [selectedReport, setSelectedReport] = useState<StoredReport | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<StoredReport | null>(null);

  const hasActiveFilters = Boolean(
    searchTerm || typeFilter !== 'all' || formatFilter !== 'all' || dateRangeStart || dateRangeEnd
  );

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const reportDate = new Date(report.createdAt);
      if (searchTerm && !report.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'all' && report.type !== typeFilter) {
        return false;
      }
      if (formatFilter !== 'all' && report.format !== formatFilter) {
        return false;
      }
      if (dateRangeStart && isBefore(reportDate, dateRangeStart)) {
        return false;
      }
      if (dateRangeEnd && isAfter(reportDate, dateRangeEnd)) {
        return false;
      }
      return true;
    });
  }, [reports, searchTerm, typeFilter, formatFilter, dateRangeStart, dateRangeEnd]);

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setFormatFilter('all');
    setDateRangeStart(undefined);
    setDateRangeEnd(undefined);
  };

  const openPreview = (report: StoredReport) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };

  const downloadReport = (report: StoredReport) => {
    const content = report.content || 'Sem conteúdo disponível';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.fileName || report.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório descarregado com sucesso');
  };

  const handleDeleteConfirm = () => {
    if (reportToDelete) {
      deleteClientReport(clientId, reportToDelete.id);
      setReports(prev => prev.filter(r => r.id !== reportToDelete.id));
      setReportToDelete(null);
      toast.success('Relatório eliminado com sucesso');
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Filtros</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={clearFilters}
          >
            Limpar filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="grid gap-2 min-w-0">
            <Label htmlFor="search">Pesquisar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Pesquisar por título..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2 min-w-0">
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

          <div className="grid gap-2 min-w-0">
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

          <div className="grid gap-2 min-w-0">
            <Label>Período</Label>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-sm truncate flex-1 justify-start font-normal"
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

              <span className="text-muted-foreground">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-sm truncate flex-1 justify-start font-normal"
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

      <div className="space-y-4 min-w-0">
        <h3 className="text-sm font-semibold">
          Relatórios Gerados ({filteredReports.length})
        </h3>

        {filteredReports.length > 0 ? (
          <div className="grid gap-3">
            {filteredReports.map(report => {
              const FormatIcon = formatIcons[report.format];

              return (
                <div
                  key={report.id}
                  className="p-4 rounded-lg border bg-card min-w-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn('p-2 rounded-lg shrink-0', formatTileStyles[report.format])}>
                        <FormatIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium truncate">{report.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <span>{format(new Date(report.createdAt), 'dd/MM/yyyy')}</span>
                          <span>{typeName[report.type]}</span>
                          <Badge variant="secondary" className="font-normal">{report.format.toUpperCase()}</Badge>
                          {report.fileSize > 0 && <span>{formatFileSize(report.fileSize)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openPreview(report)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Pré-visualizar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => downloadReport(report)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Descarregar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setReportToDelete(report)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title="Nenhum relatório encontrado"
            description={hasActiveFilters
              ? 'Nenhum relatório corresponde aos filtros selecionados.'
              : 'Exporte o primeiro relatório na secção Templates para o ver aqui.'}
            className="border border-dashed rounded-lg"
            action={hasActiveFilters ? {
              label: 'Limpar filtros',
              onClick: clearFilters,
              variant: 'outline'
            } : undefined}
          />
        )}
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && (
                <>
                  {(() => {
                    const FormatIcon = formatIcons[selectedReport.format];
                    return <FormatIcon className="h-4 w-4" />;
                  })()}
                  <span>{selectedReport.title}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedReport && (
                <>
                  Gerado em {format(new Date(selectedReport.createdAt), 'dd/MM/yyyy')} • {typeName[selectedReport.type]}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="h-96 overflow-y-auto p-4 rounded-md border bg-muted/40 font-mono text-sm whitespace-pre-wrap">
            {selectedReport?.content || 'Sem conteúdo para visualização'}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Fechar
            </Button>
            {selectedReport && (
              <Button onClick={() => downloadReport(selectedReport)}>
                <Download className="h-4 w-4 mr-2" />
                <span>Descarregar</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!reportToDelete}
        onOpenChange={(open) => !open && setReportToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar relatório"
        description={`Tem a certeza que deseja eliminar "${reportToDelete?.title ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmText="Eliminar"
      />
    </div>
  );
};

export default ReportHistory;
