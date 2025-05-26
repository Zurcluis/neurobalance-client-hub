import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, X, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Payment } from '@/types/client';
import { toast } from 'sonner';

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
  { id: 'session', label: 'Sessão Individual Neurofeedback', value: 55 }
];

const ClientPayments = ({ payments, clientId, onAddPayment, onDeletePayment, onEditPayment }: ClientPaymentsProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  
  const paymentForm = useForm<Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>>({
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      valor: 85,
      descricao: 'Avaliação Inicial',
      tipo: 'Multibanco'
    }
  });
  
  const editPaymentForm = useForm<Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>>({
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      valor: 0,
      descricao: '',
      tipo: 'Multibanco'
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
    paymentForm.reset({
      data: new Date().toISOString().split('T')[0],
      valor: 85,
      descricao: 'Avaliação Inicial',
      tipo: 'Multibanco'
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
      data: payment.data,
      valor: payment.valor,
      descricao: payment.descricao,
      tipo: payment.tipo
    });
    setIsEditDialogOpen(true);
  };

  const calculateTotal = () => {
    return payments.reduce((total, payment) => total + payment.valor, 0);
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <span>Pagamentos</span>
        </CardTitle>
        <Button 
          className="bg-[#3f9094] hover:bg-[#265255]"
          onClick={() => setIsPaymentDialogOpen(true)}
        >
          Registar Pagamento
        </Button>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
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
                    <p className="text-sm text-gray-600 mt-1">{payment.tipo}</p>
                  </div>
                  <div className="text-xl font-bold">€{payment.valor}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-600">Sem histórico de pagamentos disponível</p>
          </div>
        )}
      </CardContent>

      {/* Modal para adicionar novo pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registar Novo Pagamento</DialogTitle>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagamento</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        handlePaymentTypeChange(value, paymentForm);
                      }}
                      defaultValue="initial"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={field.value} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label} (€{type.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={paymentForm.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (€)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              
              <div className="flex justify-end gap-2">
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
      
      {/* Modal para editar pagamento existente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Pagamento</DialogTitle>
          </DialogHeader>
          <Form {...editPaymentForm}>
            <form onSubmit={editPaymentForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editPaymentForm.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
              
              <FormField
                control={editPaymentForm.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (€)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editPaymentForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  Atualizar Pagamento
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
