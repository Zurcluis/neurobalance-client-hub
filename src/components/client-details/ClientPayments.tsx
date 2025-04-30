
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { Payment } from '@/types/client';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClientPaymentsProps {
  payments: Payment[];
  clientId: string;
  onAddPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
}

const PAYMENT_TYPES = [
  { id: 'avaliacao-inicial', label: 'Avaliação Inicial', value: 120 },
  { id: 'segunda-avaliacao', label: 'Segunda Avaliação', value: 100 },
  { id: 'pack-mensal', label: 'Pack Mensal Neurofeedback', value: 400 },
  { id: 'neurofeedback', label: 'Neurofeedback', value: 80 }
];

const ClientPayments = ({ payments, clientId, onAddPayment, onDeletePayment }: ClientPaymentsProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = React.useState(PAYMENT_TYPES[0]);
  const paymentForm = useForm<Payment>({
    defaultValues: {
      id: '',
      clientId: clientId,
      date: new Date().toISOString().split('T')[0],
      amount: PAYMENT_TYPES[0].value,
      description: PAYMENT_TYPES[0].label,
      method: '',
    }
  });

  const handleServiceTypeChange = (typeId: string) => {
    const selectedType = PAYMENT_TYPES.find(type => type.id === typeId) || PAYMENT_TYPES[0];
    setSelectedPaymentType(selectedType);
    
    paymentForm.setValue('description', selectedType.label);
    paymentForm.setValue('amount', selectedType.value);
  };

  const handleSubmit = (data: Payment) => {
    onAddPayment(data);
    setIsPaymentDialogOpen(false);
    toast.success('Pagamento registado com sucesso');
  };

  const handleDeletePayment = (paymentId: string) => {
    onDeletePayment(paymentId);
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>Histórico de Pagamentos</span>
        </CardTitle>
        <Button 
          className="bg-[#3f9094] hover:bg-[#265255]"
          onClick={() => {
            paymentForm.reset({
              id: '',
              clientId: clientId,
              date: new Date().toISOString().split('T')[0],
              amount: PAYMENT_TYPES[0].value,
              description: PAYMENT_TYPES[0].label,
              method: '',
            });
            setSelectedPaymentType(PAYMENT_TYPES[0]);
            setIsPaymentDialogOpen(true);
          }}
        >
          Registar Pagamento
        </Button>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="p-4 rounded-lg bg-[#3f9094]/20 border border-white/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{payment.description}</h3>
                    <p className="text-sm text-gray-600">
                      Data: {new Date(payment.date).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">€{payment.amount.toLocaleString()}</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeletePayment(payment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">{payment.method}</p>
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
            <DialogTitle>Registar Pagamento</DialogTitle>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Serviço</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          handleServiceTypeChange(value);
                          field.onChange(PAYMENT_TYPES.find(type => type.id === value)?.label);
                        }}
                        defaultValue={PAYMENT_TYPES[0].id}
                        className="grid grid-cols-1 gap-2"
                      >
                        {PAYMENT_TYPES.map((type) => (
                          <div key={type.id} className="flex items-center space-x-2 rounded-md border p-3">
                            <RadioGroupItem value={type.id} id={type.id} />
                            <FormLabel htmlFor={type.id} className="flex-1 cursor-pointer">
                              {type.label}
                              <span className="ml-1 text-sm text-muted-foreground"> - €{type.value}</span>
                            </FormLabel>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" required />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (€)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          required 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={paymentForm.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="MB WAY, Transferência, Cartão, etc."
                      />
                    </FormControl>
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
