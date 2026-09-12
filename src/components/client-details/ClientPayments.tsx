import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, X, Edit, Download, Filter, Wallet, Landmark, Receipt, Clock, LucideIcon } from 'lucide-react';
import KpiCard from '@/components/shared/KpiCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, UseFormReturn } from 'react-hook-form';
import { Payment } from '@/types/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, isBefore, isAfter, parseISO, isValid, startOfQuarter } from 'date-fns';
import { formatCurrency } from '@/utils/formatUtils';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { cn } from '@/lib/utils';

interface ClientPaymentsProps {
  payments: Payment[];
  clientId: string;
  onAddPayment: (payment: Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => void;
  onDeletePayment: (paymentId: number) => void;
  onEditPayment?: (paymentId: number, payment: Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => void;
  isLoading?: boolean;
}

type PaymentInput = Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'> & { com_iva?: boolean };
type FilterPeriod = 'all' | '30days' | 'thisMonth';

const paymentTypes = [
  { id: 'initial', label: 'Avaliação Inicial', value: 85 },
  { id: 'second', label: 'Segunda Avaliação', value: 85 },
  { id: 'monthly', label: 'Pack Mensal Neurofeedback', value: 400 },
  { id: 'session', label: 'Sessão Individual Neurofeedback', value: 55 },
  { id: 'partial', label: 'Pagamento Parcial', value: 0 }
];

const paymentMethods = ['Dinheiro', 'Multibanco', 'MBWay', 'Transferência'];

const periodFilters: { value: FilterPeriod; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: 'thisMonth', label: 'Este mês' }
];

const parsePaymentDate = (value: string): Date | null => {
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

const createDefaultPayment = (): PaymentInput => ({
  data: format(new Date(), 'yyyy-MM-dd'),
  valor: 85,
  descricao: 'Avaliação Inicial',
  tipo: 'Multibanco',
  nif: '',
  tipo_servico: 'Serviços',
  numero_fatura: '',
  valor_base: 69.11,
  valor_iva: 15.89,
  retencao: 0,
  estado: 'pago',
  com_iva: true
});

const estadoBadgeStyles: Record<string, string> = {
  pago: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  pendente: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  anulado: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
};

const formatPaymentDate = (value: string): string => {
  const parsed = parsePaymentDate(value);
  return parsed ? format(parsed, 'dd/MM/yyyy') : 'Data inválida';
};

const EstadoBadge = ({ estado }: { estado?: string }) => {
  const value = estado || 'pago';
  const style = estadoBadgeStyles[value.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border';

  return (
    <Badge variant="outline" className={cn('font-medium capitalize', style)}>
      {value}
    </Badge>
  );
};

const IconTile = ({ icon: Icon, className }: { icon: LucideIcon; className?: string }) => (
  <div className={cn('h-9 w-9 shrink-0 rounded-lg flex items-center justify-center bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300', className)}>
    <Icon className="h-[18px] w-[18px]" />
  </div>
);

const SummaryTile = ({
  icon,
  title,
  children,
  footer
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <div className="rounded-lg border bg-card p-4 min-w-0">
    <div className="flex items-center gap-2.5 mb-3">
      <IconTile icon={icon} />
      <h4 className="text-sm font-semibold leading-tight min-w-0">{title}</h4>
    </div>
    <div className="space-y-2">{children}</div>
    {footer}
  </div>
);

const SummaryRow = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="text-muted-foreground min-w-0 truncate">{label}</span>
    <span className={cn('font-semibold tabular-nums text-foreground', className)}>{value}</span>
  </div>
);

interface PaymentRowProps {
  payment: Payment;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}

const PaymentRow = ({ payment, onEdit, onDelete }: PaymentRowProps) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border bg-card p-4">
    <div className="flex items-start gap-3 min-w-0">
      <IconTile icon={Receipt} />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium truncate">{payment.descricao}</h3>
          <EstadoBadge estado={payment.estado} />
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatPaymentDate(payment.data)}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-1.5 text-sm text-muted-foreground">
          <span>{payment.tipo}</span>
          {payment.numero_fatura && (
            <Badge variant="secondary" className="font-normal">Fatura: {payment.numero_fatura}</Badge>
          )}
        </div>
      </div>
    </div>
    <div className="flex sm:flex-col sm:items-end justify-between sm:justify-start gap-1">
      <div className="sm:text-right">
        <div className="text-lg font-bold tabular-nums">{formatCurrency(payment.valor)}</div>
        {payment.valor_base ? (
          <div className="text-xs text-muted-foreground">
            Base: {formatCurrency(payment.valor_base)} + IVA: {formatCurrency(payment.valor_iva || 0)}
          </div>
        ) : null}
      </div>
      <div className="flex sm:justify-end">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(payment)}>
          <Edit className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => onDelete(payment)}>
          <X className="h-4 w-4" />
          <span className="sr-only">Eliminar</span>
        </Button>
      </div>
    </div>
  </div>
);

const paymentFormFields = (form: UseFormReturn<PaymentInput>, showPresets: boolean, onPresetChange?: (id: string) => void) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="data"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data</FormLabel>
            <FormControl>
              <Input {...field} type="date" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="numero_fatura"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nº Fatura</FormLabel>
            <FormControl>
              <Input {...field} placeholder="FT 2026/..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="nif"
        render={({ field }) => (
          <FormItem>
            <FormLabel>NIF Cliente</FormLabel>
            <FormControl>
              <Input {...field} placeholder="999999999" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tipo_servico"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipologia</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'Serviços'}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Serviços">Serviços</SelectItem>
                <SelectItem value="Produtos">Produtos</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <div className="p-4 rounded-lg border bg-muted/40 space-y-4">
      <FormField
        control={form.control}
        name="com_iva"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="text-sm font-medium cursor-pointer">
              Aplicar IVA (23%)
            </FormLabel>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name="valor_base"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Valor Base (€)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="valor_iva"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">IVA (23%)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" readOnly className="bg-muted/60" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="retencao"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Retenção (€)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>

    <FormField
      control={form.control}
      name="descricao"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Descrição / Pack</FormLabel>
          {showPresets && (
            <div className="mb-2">
              <Select onValueChange={(value) => onPresetChange?.(value)}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Valores predefinidos" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <FormControl>
            <Input {...field} placeholder="Descrição personalizada" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="valor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total a Pagar (€)</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                step="0.01"
                className="font-bold text-lg"
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tipo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Método</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Método de pagamento" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </>
);

const usePaymentAmountSync = (form: UseFormReturn<PaymentInput>) => {
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (!name) return;

      const comIva = !!value.com_iva;
      const ret = Number(value.retencao) || 0;

      if (name === 'valor_base' || name === 'com_iva') {
        const base = Number(value.valor_base) || 0;
        const iva = comIva ? Number((base * 0.23).toFixed(2)) : 0;
        const targetValor = Number((base + iva - ret).toFixed(2));

        if (form.getValues('valor_iva') !== iva) {
          form.setValue('valor_iva', iva, { shouldValidate: true });
        }
        if (form.getValues('valor') !== targetValor) {
          form.setValue('valor', targetValor, { shouldValidate: true });
        }
      }

      if (name === 'valor') {
        const total = Number(value.valor) || 0;
        if (comIva) {
          const base = Number((total / 1.23).toFixed(2));
          const iva = Number((total - base).toFixed(2));

          if (form.getValues('valor_base') !== base) {
            form.setValue('valor_base', base, { shouldValidate: true });
          }
          if (form.getValues('valor_iva') !== iva) {
            form.setValue('valor_iva', iva, { shouldValidate: true });
          }
        } else {
          if (form.getValues('valor_base') !== total) {
            form.setValue('valor_base', total, { shouldValidate: true });
          }
          if (form.getValues('valor_iva') !== 0) {
            form.setValue('valor_iva', 0, { shouldValidate: true });
          }
        }
      }

      if (name === 'retencao') {
        const base = Number(value.valor_base) || 0;
        const iva = Number(value.valor_iva) || 0;
        const targetValor = Number((base + iva - ret).toFixed(2));
        if (form.getValues('valor') !== targetValor) {
          form.setValue('valor', targetValor, { shouldValidate: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
};

const ClientPayments = ({ payments, clientId, onAddPayment, onDeletePayment, onEditPayment, isLoading = false }: ClientPaymentsProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');

  const paymentForm = useForm<PaymentInput>({ defaultValues: createDefaultPayment() });
  const editPaymentForm = useForm<PaymentInput>({ defaultValues: createDefaultPayment() });

  usePaymentAmountSync(paymentForm);
  usePaymentAmountSync(editPaymentForm);

  const filteredPayments = useMemo(() => {
    if (filterPeriod === 'all') return payments;

    const now = new Date();
    const cutoffDate = filterPeriod === '30days' ? subDays(now, 30) : startOfMonth(now);

    return payments.filter((p) => {
      const paymentDate = parsePaymentDate(p.data);
      return paymentDate ? !isBefore(paymentDate, cutoffDate) : false;
    });
  }, [payments, filterPeriod]);

  const totalPaid = useMemo(
    () => filteredPayments.reduce((total, payment) => total + payment.valor, 0),
    [filteredPayments]
  );

  const taxSummary = useMemo(() => {
    const summary = {
      base: 0,
      iva: 0,
      retencao: 0,
      total: 0,
      ss_base_servicos: 0,
      ss_base_produtos: 0
    };

    const quarterStart = startOfQuarter(new Date());

    filteredPayments.forEach((p) => {
      const pDate = parsePaymentDate(p.data);
      if (pDate && isAfter(pDate, quarterStart)) {
        const baseVal = p.valor_base || 0;
        summary.base += baseVal;
        summary.iva += p.valor_iva || 0;
        summary.retencao += p.retencao || 0;
        summary.total += p.valor;

        if (p.tipo_servico === 'Produtos') {
          summary.ss_base_produtos += baseVal;
        } else {
          summary.ss_base_servicos += baseVal;
        }
      }
    });

    return summary;
  }, [filteredPayments]);

  const pendingPaymentsCount = useMemo(
    () => filteredPayments.filter(p => p.estado?.toLowerCase() === 'pendente').length,
    [filteredPayments]
  );

  const ssIncidenciaServicos = taxSummary.ss_base_servicos * 0.7;
  const ssIncidenciaProdutos = taxSummary.ss_base_produtos * 0.2;
  const ssTotalIncidencia = ssIncidenciaServicos + ssIncidenciaProdutos;
  const ssPagar = ssTotalIncidencia * 0.214;

  const handlePaymentTypeChange = (value: string, form: UseFormReturn<PaymentInput>) => {
    const selectedType = paymentTypes.find((type) => type.id === value);
    if (selectedType) {
      form.setValue('descricao', selectedType.label);
      form.setValue('valor', selectedType.value);
    }
  };

  const exportToCSV = () => {
    const escapeCell = (cell: string) => (cell.includes(';') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell);
    const headers = ['Data', 'Descrição', 'Método', 'Valor'];
    const rows = filteredPayments.map((p) => [
      formatPaymentDate(p.data),
      p.descricao,
      p.tipo,
      p.valor.toFixed(2).replace('.', ',')
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(';'))
      .join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagamentos_cliente_${clientId}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success('Ficheiro CSV exportado com sucesso');
  };

  const onSubmit = (data: PaymentInput) => {
    const { com_iva, ...paymentData } = data;
    onAddPayment(paymentData);
    setIsPaymentDialogOpen(false);
    paymentForm.reset(createDefaultPayment());
    toast.success('Pagamento registado com sucesso');
  };

  const onEditSubmit = (data: PaymentInput) => {
    if (paymentToEdit && onEditPayment) {
      const { com_iva, ...paymentData } = data;
      onEditPayment(paymentToEdit.id, paymentData);
      setIsEditDialogOpen(false);
      setPaymentToEdit(null);
      toast.success('Pagamento atualizado com sucesso');
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setPaymentToEdit(payment);
    editPaymentForm.reset({
      data: payment.data,
      valor: payment.valor,
      descricao: payment.descricao,
      tipo: payment.tipo,
      nif: payment.nif || '',
      tipo_servico: payment.tipo_servico || 'Serviços',
      numero_fatura: payment.numero_fatura || '',
      valor_base: payment.valor_base || 0,
      valor_iva: payment.valor_iva || 0,
      retencao: payment.retencao || 0,
      estado: payment.estado || 'pago',
      com_iva: (payment.valor_iva || 0) > 0
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (paymentToDelete) {
      onDeletePayment(paymentToDelete.id);
      setPaymentToDelete(null);
      toast.success('Pagamento eliminado com sucesso');
    }
  };

  const renderPaymentList = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (filteredPayments.length === 0) {
      return (
        <EmptyState
          icon={<Wallet className="h-10 w-10" />}
          title="Sem pagamentos registados"
          description="Não existem pagamentos para o período selecionado. Registe o primeiro pagamento do cliente."
        />
      );
    }

    return (
      <div className="space-y-4 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard icon={Wallet} label="Total no Período" value={formatCurrency(totalPaid)} tone="teal" />
          <KpiCard icon={Receipt} label="Pagamentos" value={filteredPayments.length} sub="No período selecionado" tone="blue" />
          <KpiCard icon={Clock} label="Por Regularizar" value={pendingPaymentsCount} sub="Pagamentos pendentes" tone="amber" />
        </div>
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onEdit={handleEditPayment}
              onDelete={setPaymentToDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <IconTile icon={Calculator} />
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">Pagamentos</CardTitle>
            <p className="text-sm text-muted-foreground truncate">
              Total no período: <span className="font-semibold text-foreground tabular-nums">{formatCurrency(totalPaid)}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as FilterPeriod)}>
            <SelectTrigger className="w-[170px] h-9">
              <Filter className="h-3.5 w-3.5 mr-1 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodFilters.map((period) => (
                <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={exportToCSV} disabled={filteredPayments.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button size="sm" className="h-9" onClick={() => setIsPaymentDialogOpen(true)}>
            Registar Pagamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list">Lista de Pagamentos</TabsTrigger>
            <TabsTrigger value="taxes">Impostos &amp; Deduções</TabsTrigger>
          </TabsList>

          <TabsContent value="list">{renderPaymentList()}</TabsContent>

          <TabsContent value="taxes">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SummaryTile icon={Receipt} title="Resumo Trimestral (Estimado)">
                <SummaryRow label="Total Faturado (Base)" value={formatCurrency(taxSummary.base)} />
                <SummaryRow label="IVA Liquidado (23%)" value={formatCurrency(taxSummary.iva)} className="text-red-600 dark:text-red-300" />
                <SummaryRow label="Retenção na Fonte" value={`- ${formatCurrency(taxSummary.retencao)}`} className="text-emerald-600 dark:text-emerald-300" />
              </SummaryTile>

              <SummaryTile
                icon={Landmark}
                title="Simulação Segurança Social"
                footer={<p className="mt-3 text-xs text-muted-foreground">*Regime Simplificado (Base Trimestral)</p>}
              >
                <SummaryRow label="Incidência Serviços (70%)" value={formatCurrency(ssIncidenciaServicos)} />
                <SummaryRow label="Incidência Produtos (20%)" value={formatCurrency(ssIncidenciaProdutos)} />
                <div className="flex items-baseline justify-between gap-3 border-t pt-2">
                  <span className="text-sm text-muted-foreground">A Pagar (21.4%)</span>
                  <span className="text-xl font-bold tabular-nums text-teal-700 dark:text-teal-300">{formatCurrency(ssPagar)}</span>
                </div>
              </SummaryTile>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registar Novo Pagamento</DialogTitle>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onSubmit)} className="space-y-4">
              {paymentFormFields(paymentForm, true, (id) => handlePaymentTypeChange(id, paymentForm))}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registar Pagamento
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
          </DialogHeader>
          <Form {...editPaymentForm}>
            <form onSubmit={editPaymentForm.handleSubmit(onEditSubmit)} className="space-y-4">
              {paymentFormFields(editPaymentForm, false)}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Atualizar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!paymentToDelete}
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar pagamento"
        description={`Tem a certeza que deseja eliminar "${paymentToDelete?.descricao ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmText="Eliminar"
      />
    </Card>
  );
};

export default ClientPayments;
