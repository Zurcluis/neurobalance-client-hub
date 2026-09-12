import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ClientDetailData } from '@/types/client';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { GitCompareArrows, ArrowLeftRight, Download, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatCurrency } from '@/utils/formatUtils';
import { readClientReports } from './reportHistoryStore';
import type { StoredReportMetrics } from './reportHistoryStore';
import { cn } from '@/lib/utils';

interface ReportCompareProps {
  client: ClientDetailData;
}

type MetricFormat = 'count' | 'currency' | 'percent';

interface MetricDefinition {
  key: keyof StoredReportMetrics;
  label: string;
  metricFormat: MetricFormat;
}

const metricDefinitions: MetricDefinition[] = [
  { key: 'sessionsCount', label: 'Número de Sessões', metricFormat: 'count' },
  { key: 'paymentsTotal', label: 'Total Pago', metricFormat: 'currency' },
  { key: 'averagePayment', label: 'Média por Sessão', metricFormat: 'currency' },
  { key: 'completionRate', label: 'Taxa de Conclusão', metricFormat: 'percent' }
];

interface MetricDiff {
  value: number;
  percentage: number;
  increased: boolean;
}

const formatMetricValue = (value: number | undefined, metricFormat: MetricFormat): string => {
  if (value === undefined) return 'N/D';
  switch (metricFormat) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return `${value}%`;
    default:
      return String(value);
  }
};

const calculateDiff = (valueA: number | undefined, valueB: number | undefined): MetricDiff | null => {
  if (valueA === undefined || valueB === undefined) return null;
  const diff = valueB - valueA;
  return {
    value: diff,
    percentage: valueA !== 0 ? (diff / valueA) * 100 : 0,
    increased: diff > 0
  };
};

const ReportCompare = ({ client }: ReportCompareProps) => {
  const clientId = typeof client.id === 'number' ? client.id : 0;

  const availableReports = useMemo(
    () => readClientReports(clientId),
    [clientId]
  );

  const [selectedReportAId, setSelectedReportAId] = useState<string | null>(null);
  const [selectedReportBId, setSelectedReportBId] = useState<string | null>(null);

  const defaultAId = availableReports[1]?.id ?? availableReports[0]?.id;
  const defaultBId = availableReports[0]?.id;

  const reportA = availableReports.find(r => r.id === (selectedReportAId ?? defaultAId));
  const reportB = availableReports.find(r => r.id === (selectedReportBId ?? defaultBId));

  const switchReports = () => {
    setSelectedReportAId(selectedReportBId ?? defaultBId ?? null);
    setSelectedReportBId(selectedReportAId ?? defaultAId ?? null);
  };

  const exportComparison = () => {
    if (!reportA || !reportB) return;

    const rows: string[][] = [
      ['Métrica', `${reportA.title} (${format(new Date(reportA.createdAt), 'dd/MM/yyyy')})`, `${reportB.title} (${format(new Date(reportB.createdAt), 'dd/MM/yyyy')})`, 'Diferença'],
      ...metricDefinitions.map((metric) => {
        const valueA = reportA.metrics?.[metric.key];
        const valueB = reportB.metrics?.[metric.key];
        const diff = calculateDiff(valueA, valueB);
        return [
          metric.label,
          formatMetricValue(valueA, metric.metricFormat),
          formatMetricValue(valueB, metric.metricFormat),
          diff ? `${diff.increased ? '+' : ''}${diff.value.toFixed(2)} (${diff.percentage.toFixed(1)}%)` : 'N/D'
        ];
      })
    ];

    const csvContent = rows.map(row => row.join(';')).join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparacao_relatorios_${client.nome ? client.nome.replace(/\s+/g, '_') + '_' : ''}${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Comparação exportada com sucesso');
  };

  if (availableReports.length < 2) {
    return (
      <EmptyState
        icon={<FileText className="h-10 w-10" />}
        title="Relatórios insuficientes"
        description="Exporte pelo menos dois relatórios na secção Templates para poder compará-los aqui."
      />
    );
  }

  if (!reportA || !reportB || reportA.id === reportB.id) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecione dois relatórios diferentes para comparar.
      </p>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Select value={reportA.id} onValueChange={setSelectedReportAId}>
          <SelectTrigger className="w-full sm:max-w-sm">
            <SelectValue placeholder="Selecione o primeiro relatório" />
          </SelectTrigger>
          <SelectContent>
            {availableReports.map(report => (
              <SelectItem key={report.id} value={report.id}>
                {report.title} ({format(new Date(report.createdAt), 'dd/MM/yyyy')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={switchReports}
          className="h-10 w-10 shrink-0 self-center"
          aria-label="Trocar relatórios"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>

        <Select value={reportB.id} onValueChange={setSelectedReportBId}>
          <SelectTrigger className="w-full sm:max-w-sm">
            <SelectValue placeholder="Selecione o segundo relatório" />
          </SelectTrigger>
          <SelectContent>
            {availableReports.map(report => (
              <SelectItem key={report.id} value={report.id}>
                {report.title} ({format(new Date(report.createdAt), 'dd/MM/yyyy')})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card p-4 min-w-0">
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <GitCompareArrows className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-semibold">Comparação de Relatórios</h4>
            <p className="text-sm text-muted-foreground truncate">
              {reportA.title} ({format(new Date(reportA.createdAt), 'dd/MM/yyyy')}) vs. {reportB.title} ({format(new Date(reportB.createdAt), 'dd/MM/yyyy')})
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border min-w-0">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold">Métrica</th>
                <th className="px-4 py-3 text-center font-semibold">{reportA.title}</th>
                <th className="px-4 py-3 text-center font-semibold">{reportB.title}</th>
              </tr>
            </thead>
            <tbody>
              {metricDefinitions.map((metric, index) => {
                const valueA = reportA.metrics?.[metric.key];
                const valueB = reportB.metrics?.[metric.key];
                const diff = calculateDiff(valueA, valueB);

                return (
                  <tr key={metric.key} className={cn(index > 0 && 'border-t')}>
                    <td className="px-4 py-3 font-medium bg-muted/20">{metric.label}</td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {formatMetricValue(valueA, metric.metricFormat)}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {formatMetricValue(valueB, metric.metricFormat)}
                      {diff && diff.value !== 0 && (
                        <span className={cn(
                          'ml-2 inline-flex items-center gap-1 text-xs font-semibold',
                          diff.increased ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {diff.increased ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {diff.increased ? '+' : ''}{formatMetricValue(Math.abs(diff.value), metric.metricFormat)}
                          <span className="font-normal text-muted-foreground">
                            ({diff.percentage.toFixed(1)}%)
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={exportComparison}>
            <Download className="h-4 w-4" />
            <span>Exportar Comparação</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportCompare;
