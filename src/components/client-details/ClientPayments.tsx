import React, { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, X, Edit, Download, Filter } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Payment } from '@/types/client';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, isAfter, parseISO } from 'date-fns';

interface ClientPaymentsProps {
  payments: Payment[];
  clientId: string;
  onAddPayment: (payment: Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => void;
  onDeletePayment: (paymentId: number) => void;
  onEditPayment?: (paymentId: number, payment: Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => void;
}

// Tipos de pagamento e valores
const paymentTypes = [
  { id: 'initial', label: 'Avaliação Inicial', value: 85 },
  { id: 'second', label: 'Segunda Avaliação', value: 85 },
  { id: 'monthly', label: 'Pack Mensal Neurofeedback', value: 400 },
  { id: 'session', label: 'Sessão Individual Neurofeedback', value: 55 },
  { id: 'partial', label: 'Pagamento Parcial', value: 0 }
];

const ClientPayments = ({ payments, clientId, onAddPayment, onDeletePayment, onEditPayment }: ClientPaymentsProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30days' | 'thisMonth'>('all');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [expectedAmount, setExpectedAmount] = useState(0);

  // Filtrar pagamentos por período
  const filteredPayments = useMemo(() => {
    if (filterPeriod === 'all') return payments;

    const now = new Date();
    let cutoffDate: Date;

    if (filterPeriod === '30days') {
      cutoffDate = subDays(now, 30);
    } else {
      cutoffDate = startOfMonth(now);
    }

    return payments.filter(p => {
      const paymentDate = parseISO(p.data);
      return isAfter(paymentDate, cutoffDate);
    });
  }, [payments, filterPeriod]);

  const calculateTotal = () => {
    return filteredPayments.reduce((total, payment) => total + payment.valor, 0);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Método', 'Valor'];
    const rows = filteredPayments.map(p => [
      format(parseISO(p.data), 'dd/MM/yyyy'),
      p.descricao,
      p.tipo,
      p.valor.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagamentos_cliente_${clientId}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();

    toast.success('Ficheiro CSV exportado com sucesso');
  };

  const initialDefaultBase = 85 / 1.23;
  const initialDefaultIva = initialDefaultBase * 0.23;

  const paymentForm = useForm<Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'> & { com_iva?: boolean }>({
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      valor: 85,
      descricao: 'Avaliação Inicial',
      tipo: 'Multibanco',
      nif: '',
      tipo_servico: 'Serviços',
      numero_fatura: '',
      valor_base: Number(initialDefaultBase.toFixed(2)),
      valor_iva: Number(initialDefaultIva.toFixed(2)),
      retencao: 0,
      estado: 'pago',
      com_iva: true
    }
  });



  const editPaymentForm = useForm<Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'> & { com_iva?: boolean }>({
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      valor: 0,
      descricao: '',
      tipo: 'Multibanco',
      nif: '',
      tipo_servico: 'Serviços',
      numero_fatura: '',
      valor_base: 0,
      valor_iva: 0,
      retencao: 0,
      estado: 'pago',
      com_iva: true
    }
  });

  // Handle payment type selection
  const handlePaymentTypeChange = (value: string, form: any) => {
    const selectedType = paymentTypes.find(type => type.id === value);
    if (selectedType) {
      form.setValue('descricao', selectedType.label);
      form.setValue('valor', selectedType.value);
    }
  };

  const onSubmit = (data: Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => {
    onAddPayment(data);
    setIsPaymentDialogOpen(false);
    
    const resetBase = 85 / 1.23;
    const resetIva = resetBase * 0.23;
    paymentForm.reset({
      data: new Date().toISOString().split('T')[0],
      valor: 85,
      descricao: 'Avaliação Inicial',
      tipo: 'Multibanco',
      nif: '',
      tipo_servico: 'Serviços',
      numero_fatura: '',
      valor_base: Number(resetBase.toFixed(2)),
      valor_iva: Number(resetIva.toFixed(2)),
      retencao: 0,
      estado: 'pago',
      com_iva: true
    });
    toast.success('Pagamento registado com sucesso');
  };





  const onEditSubmit = (data: Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>) => {
    if (paymentToEdit && onEditPayment) {
      onEditPayment(paymentToEdit.id, data);
      setIsEditDialogOpen(false);
      setPaymentToEdit(null);
      toast.success('Pagamento atualizado com sucesso');
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setPaymentToEdit(payment);
    editPaymentForm.reset({
      data: payment.data ? payment.data.split('T')[0] : '',
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

  // Cálculos para a aba de impostos (Trimestral)
  const taxSummary = useMemo(() => {
    const quarterTotals = {
      base: 0,
      iva: 0,
      retencao: 0,
      total: 0,
      ss_base_servicos: 0,
      ss_base_produtos: 0
    };

    // Filtrar apenas o trimestre atual (simples para demo, idealmente selecionável)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentQuarterStart = new Date(now.getFullYear(), Math.floor(currentMonth / 3) * 3, 1);

    filteredPayments.forEach(p => {
      const pDate = new Date(p.data);
      if (pDate >= currentQuarterStart) {
        const baseVal = p.valor_base || 0;
        quarterTotals.base += baseVal;
        quarterTotals.iva += p.valor_iva || 0;
        quarterTotals.retencao += p.retencao || 0;
        quarterTotals.total += p.valor;

        // Categorizar para SS
        // Assumindo 'Serviços' como default ou valores específicos
        // Se tipo_servico for 'Produtos', coeficiente 0.2. Se 'Serviços' ou outros, 0.7.
        if (p.tipo_servico === 'Produtos') {
          quarterTotals.ss_base_produtos += baseVal;
        } else {
          // Serviços e Outros assumem coeficiente 0.7
          quarterTotals.ss_base_servicos += baseVal;
        }
      }
    });

    return quarterTotals;
  }, [filteredPayments]);

  // Cálculo SS
  const ssIncidenciaServicos = taxSummary.ss_base_servicos * 0.7;
  const ssIncidenciaProdutos = taxSummary.ss_base_produtos * 0.2;
  const ssTotalIncidencia = ssIncidenciaServicos + ssIncidenciaProdutos;
  const ssPagar = ssTotalIncidencia * 0.214;

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <span>Pagamentos</span>
          <span className="ml-2 text-2xl font-bold text-[#3f9094]">
            €{calculateTotal().toFixed(2)}
          </span>
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredPayments.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button
            className="bg-[#3f9094] hover:bg-[#265255]"
            onClick={() => setIsPaymentDialogOpen(true)}
          >
            Registar Pagamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list">Lista de Pagamentos</TabsTrigger>
            <TabsTrigger value="taxes">Impostos & Deduções</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {filteredPayments.length > 0 ? (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-4 rounded-lg bg-[#c5cfce]/40 relative">
                    <div className="absolute right-1 top-1 flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditPayment(payment)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onDeletePayment(payment.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </div>
                    <div className="flex justify-between items-start pt-6">
                      <div>
                        <h3 className="font-medium">{payment.descricao}</h3>
                        <p className="text-sm text-gray-500">{new Date(payment.data).toLocaleDateString('pt-PT')}</p>
                        <div className="flex gap-2 text-sm text-gray-600 mt-1">
                          <span>{payment.tipo}</span>
                          {payment.numero_fatura && (
                            <span className="text-xs bg-white px-1 rounded border">Fat: {payment.numero_fatura}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">€{payment.valor.toFixed(2)}</div>
                        {payment.valor_base ? (
                          <div className="text-xs text-gray-500">Base: €{payment.valor_base} + IVA: €{payment.valor_iva}</div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-600">Sem histórico de pagamentos disponível</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="taxes">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Resumo Trimestral (Estimado)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Faturado (Base):</span>
                      <span className="font-bold">€{taxSummary.base.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">IVA Liquidado (23%):</span>
                      <span className="font-bold text-red-600">€{taxSummary.iva.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Retenção na Fonte:</span>
                      <span className="font-bold text-green-600">-€{taxSummary.retencao.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Simulação Segurança Social</h4>
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Incidência Serviços (70%):</span>
                      <span>€{ssIncidenciaServicos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Incidência Produtos (20%):</span>
                      <span>€{ssIncidenciaProdutos.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-purple-200 pt-2">
                    <span className="text-sm text-gray-600">A Pagar (21.4%):</span>
                    <span className="text-xl font-bold text-purple-700">
                      €{ssPagar.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-purple-600/80">
                    *Regime Simplificado (Base Trimestral)
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modal para adicionar novo pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registar Novo Pagamento</DialogTitle>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
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
                  control={paymentForm.control}
                  name="numero_fatura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Fatura</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="FT 2024/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
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
                  control={paymentForm.control}
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

              <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-100">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <FormField
                    control={paymentForm.control}
                    name="com_iva"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-center items-start pt-2">
                        <FormLabel className="text-xs mb-2">Com IVA (23%)</FormLabel>
                        <FormControl>
                          <Switch
                            className="data-[state=checked]:bg-green-500"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              const total = Number(paymentForm.getValues('valor')) || 0;
                              const ret = Number(paymentForm.getValues('retencao')) || 0;
                              if (checked) {
                                const base = (total + ret) / 1.23;
                                const iva = base * 0.23;
                                paymentForm.setValue('valor_base', Number(base.toFixed(2)));
                                paymentForm.setValue('valor_iva', Number(iva.toFixed(2)));
                              } else {
                                const base = total + ret;
                                paymentForm.setValue('valor_base', Number(base.toFixed(2)));
                                paymentForm.setValue('valor_iva', 0);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="valor_base"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Valor Base (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            className="bg-white"
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const val = valStr === '' ? '' : Number(valStr);
                              field.onChange(val);
                              const numVal = Number(valStr) || 0;
                              const hasIva = paymentForm.getValues('com_iva');
                              const iva = hasIva ? numVal * 0.23 : 0;
                              const ret = Number(paymentForm.getValues('retencao')) || 0;
                              paymentForm.setValue('valor_iva', Number(iva.toFixed(2)));
                              paymentForm.setValue('valor', Number((numVal + iva - ret).toFixed(2)));
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="valor_iva"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">IVA (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            readOnly
                            className="bg-gray-100"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="retencao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Retenção (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            className="bg-white"
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const val = valStr === '' ? '' : Number(valStr);
                              field.onChange(val);
                              const numVal = Number(valStr) || 0;
                              const base = Number(paymentForm.getValues('valor_base')) || 0;
                              const iva = Number(paymentForm.getValues('valor_iva')) || 0;
                              paymentForm.setValue('valor', Number((base + iva - numVal).toFixed(2)));
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={paymentForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição / Pack</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(value) => {
                          setIsPartialPayment(value === 'partial');
                          handlePaymentTypeChange(value, paymentForm);
                          // Set base value if standard type
                          const selectedType = paymentTypes.find(t => t.id === value);
                          if (selectedType && selectedType.id !== 'partial') {
                            const total = selectedType.value;
                            const hasIva = paymentForm.getValues('com_iva');
                            const base = hasIva ? total / 1.23 : total;
                            const iva = hasIva ? base * 0.23 : 0;
                            paymentForm.setValue('valor_base', Number(base.toFixed(2)));
                            paymentForm.setValue('valor_iva', Number(iva.toFixed(2)));
                            paymentForm.setValue('valor', total);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Predefinidos" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input {...field} placeholder="Descrição personalizada" className="flex-1" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={paymentForm.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Total a Pagar (€)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="font-bold text-lg bg-green-50 text-green-700 border-green-200"
                          onChange={(e) => {
                            const valStr = e.target.value;
                            const val = valStr === '' ? '' : Number(valStr);
                            field.onChange(val);
                            const numVal = Number(valStr) || 0;
                            const hasIva = paymentForm.getValues('com_iva');
                            const ret = Number(paymentForm.getValues('retencao')) || 0;
                            const base = hasIva ? (numVal + ret) / 1.23 : (numVal + ret);
                            const iva = hasIva ? base * 0.23 : 0;
                            paymentForm.setValue('valor_base', Number(base.toFixed(2)));
                            paymentForm.setValue('valor_iva', Number(iva.toFixed(2)));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem className="w-[200px]">
                      <FormLabel>Método</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={field.value} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="Multibanco">Multibanco</SelectItem>
                          <SelectItem value="MBWay">MBWay</SelectItem>
                          <SelectItem value="Transferência">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#3f9094] hover:bg-[#265255]"
                >
                  Registar Pagamento
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal para editar pagamento existente - Mantido simples ou atualizado se necessário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
          </DialogHeader>
          <Form {...editPaymentForm}>
            <form onSubmit={editPaymentForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPaymentForm.control}
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
                  control={editPaymentForm.control}
                  name="numero_fatura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Fatura</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="FT 2024/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editPaymentForm.control}
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
                  control={editPaymentForm.control}
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

              <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-100">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <FormField
                    control={editPaymentForm.control}
                    name="com_iva"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-center items-start pt-2">
                        <FormLabel className="text-xs mb-2">Com IVA (23%)</FormLabel>
                        <FormControl>
                          <Switch
                            className="data-[state=checked]:bg-green-500"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              const total = Number(editPaymentForm.getValues('valor')) || 0;
                              const ret = Number(editPaymentForm.getValues('retencao')) || 0;
                              if (checked) {
                                const base = (total + ret) / 1.23;
                                const iva = base * 0.23;
                                editPaymentForm.setValue('valor_base', Number(base.toFixed(2)));
                                editPaymentForm.setValue('valor_iva', Number(iva.toFixed(2)));
                              } else {
                                const base = total + ret;
                                editPaymentForm.setValue('valor_base', Number(base.toFixed(2)));
                                editPaymentForm.setValue('valor_iva', 0);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editPaymentForm.control}
                    name="valor_base"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Valor Base (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            className="bg-white"
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const val = valStr === '' ? '' : Number(valStr);
                              field.onChange(val);
                              const numVal = Number(valStr) || 0;
                              const hasIva = editPaymentForm.getValues('com_iva');
                              const iva = hasIva ? numVal * 0.23 : 0;
                              const ret = Number(editPaymentForm.getValues('retencao')) || 0;
                              editPaymentForm.setValue('valor_iva', Number(iva.toFixed(2)));
                              editPaymentForm.setValue('valor', Number((numVal + iva - ret).toFixed(2)));
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editPaymentForm.control}
                    name="valor_iva"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">IVA (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            readOnly
                            className="bg-gray-100"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editPaymentForm.control}
                    name="retencao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Retenção (€)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            className="bg-white"
                            onChange={(e) => {
                              const valStr = e.target.value;
                              const val = valStr === '' ? '' : Number(valStr);
                              field.onChange(val);
                              const numVal = Number(valStr) || 0;
                              const base = Number(editPaymentForm.getValues('valor_base')) || 0;
                              const iva = Number(editPaymentForm.getValues('valor_iva')) || 0;
                              editPaymentForm.setValue('valor', Number((base + iva - numVal).toFixed(2)));
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={editPaymentForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={editPaymentForm.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Total (€)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="font-bold text-lg bg-green-50 text-green-700 border-green-200"
                          onChange={(e) => {
                            const valStr = e.target.value;
                            const val = valStr === '' ? '' : Number(valStr);
                            field.onChange(val);
                            const numVal = Number(valStr) || 0;
                            const hasIva = editPaymentForm.getValues('com_iva');
                            const ret = Number(editPaymentForm.getValues('retencao')) || 0;
                            const base = hasIva ? (numVal + ret) / 1.23 : (numVal + ret);
                            const iva = hasIva ? base * 0.23 : 0;
                            editPaymentForm.setValue('valor_base', Number(base.toFixed(2)));
                            editPaymentForm.setValue('valor_iva', Number(iva.toFixed(2)));
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={editPaymentForm.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem className="w-[200px]">
                      <FormLabel>Método</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={field.value} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="Multibanco">Multibanco</SelectItem>
                          <SelectItem value="MBWay">MBWay</SelectItem>
                          <SelectItem value="Transferência">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#3f9094] hover:bg-[#265255]"
                >
                  Atualizar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClientPayments;
