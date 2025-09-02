import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Investment, InvestmentFormData, InvestmentType } from '@/types/investments';

const investmentSchema = z.object({
  symbol: z.string().min(1, 'Símbolo é obrigatório').max(10, 'Símbolo deve ter no máximo 10 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['crypto', 'stock', 'etf'] as const, {
    required_error: 'Tipo é obrigatório',
  }),
  quantity: z.number().min(0.00001, 'Quantidade deve ser maior que 0'),
  buyPrice: z.number().min(0.01, 'Preço de compra deve ser maior que 0'),
  purchaseDate: z.string().min(1, 'Data de compra é obrigatória'),
  notes: z.string().optional(),
});

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvestmentFormData) => void;
  investment?: Investment | null;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  investment
}) => {
  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      symbol: investment?.symbol || '',
      name: investment?.name || '',
      type: investment?.type || 'crypto',
      quantity: investment?.quantity || 0,
      buyPrice: investment?.buyPrice || 0,
      purchaseDate: investment?.purchaseDate || new Date().toISOString().split('T')[0],
      notes: investment?.notes || '',
    },
  });

  React.useEffect(() => {
    if (investment) {
      form.reset({
        symbol: investment.symbol,
        name: investment.name,
        type: investment.type,
        quantity: investment.quantity,
        buyPrice: investment.buyPrice,
        purchaseDate: investment.purchaseDate,
        notes: investment.notes || '',
      });
    } else {
      form.reset({
        symbol: '',
        name: '',
        type: 'crypto',
        quantity: 0,
        buyPrice: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [investment, form]);

  const handleSubmit = (data: InvestmentFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const popularCryptos = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'ADA', name: 'Cardano' },
    { symbol: 'DOT', name: 'Polkadot' },
    { symbol: 'MATIC', name: 'Polygon' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'AVAX', name: 'Avalanche' },
    { symbol: 'ATOM', name: 'Cosmos' },
    { symbol: 'LINK', name: 'Chainlink' },
    { symbol: 'UNI', name: 'Uniswap' },
  ];

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
  ];

  const popularETFs = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
    { symbol: 'EFA', name: 'iShares MSCI EAFE ETF' },
    { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF' },
  ];

  const getPopularOptions = (type: InvestmentType) => {
    switch (type) {
      case 'crypto':
        return popularCryptos;
      case 'stock':
        return popularStocks;
      case 'etf':
        return popularETFs;
      default:
        return [];
    }
  };

  const selectedType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {investment ? 'Editar Investimento' : 'Adicionar Investimento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Investimento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="crypto">Criptomoeda</SelectItem>
                      <SelectItem value="stock">Ação</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Símbolo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="BTC, AAPL, SPY..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do ativo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedType && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Opções Populares:</label>
                <div className="flex flex-wrap gap-2">
                  {getPopularOptions(selectedType).map((option) => (
                    <Button
                      key={option.symbol}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue('symbol', option.symbol);
                        form.setValue('name', option.name);
                      }}
                      className="text-xs"
                    >
                      {option.symbol}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.00001"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Compra (€)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Compra</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Notas sobre o investimento..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#3f9094] hover:bg-[#2d7a7e]">
                {investment ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
