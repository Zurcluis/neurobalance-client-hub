import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, X } from 'lucide-react';
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
}

// Tipos de pagamento e valores
const paymentTypes = [
  { id: 'initial', label: 'Avaliação Inicial', value: 85 },
  { id: 'second', label: 'Segunda Avaliação', value: 85 },
  { id: 'monthly', label: 'Pack Mensal Neurofeedback', value: 400 },
  { id: 'session', label: 'Sessão Individual Neurofeedback', value: 55 }
];

const ClientPayments = ({ payments, clientId, onAddPayment, onDeletePayment }: ClientPaymentsProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const paymentForm = useForm<Omit<Payment, 'id' | 'id_cliente' | 'criado_em' | 'updated_at'>>({
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      valor: 85,
      descricao: 'Avaliação Inicial',
      tipo: 'Multibanco'
    }
  });
  
  // Handle payment type selection
  const handlePaymentTypeChange = (value: string) => {
    const selectedType = paymentTypes.find(type => type.id === value);
    if (selectedType) {
      paymentForm.setValue('descricao', selectedType.label);
      paymentForm.setValue('valor', selectedType.value);
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => onDeletePayment(payment.id)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remover</span>
                </Button>
                <div className="flex justify-between items-start">
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
                        handlePaymentTypeChange(value);
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
    </Card>
  );
};

export default ClientPayments;
