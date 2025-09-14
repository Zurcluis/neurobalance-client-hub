import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LeadCompra, GENEROS, TIPOS, STATUS_OPTIONS } from '@/types/lead-compra';
import { User, Mail, Phone, MapPin, Euro, Calendar, Target, Save, X } from 'lucide-react';

const leadCompraSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  idade: z.number().min(16, 'Idade mínima é 16 anos').max(100, 'Idade máxima é 100 anos'),
  genero: z.enum(GENEROS, { required_error: 'Selecione um gênero' }),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  valor_pago: z.number().min(0, 'Valor deve ser positivo'),
  data_evento: z.string().min(1, 'Data do evento é obrigatória'),
  tipo: z.enum(TIPOS, { required_error: 'Selecione o tipo' }),
  status: z.enum(STATUS_OPTIONS, { required_error: 'Selecione o status' }),
  origem_campanha: z.string().optional(),
  observacoes: z.string().optional(),
});

type LeadCompraFormData = z.infer<typeof leadCompraSchema>;

interface LeadCompraFormProps {
  leadCompra?: LeadCompra;
  onSubmit: (data: LeadCompraFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const LeadCompraForm: React.FC<LeadCompraFormProps> = ({
  leadCompra,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LeadCompraFormData>({
    resolver: zodResolver(leadCompraSchema),
    defaultValues: leadCompra ? {
      nome: leadCompra.nome,
      email: leadCompra.email,
      telefone: leadCompra.telefone,
      idade: leadCompra.idade,
      genero: leadCompra.genero,
      cidade: leadCompra.cidade,
      valor_pago: leadCompra.valor_pago,
      data_evento: leadCompra.data_evento.split('T')[0], // Apenas a data
      tipo: leadCompra.tipo,
      status: leadCompra.status,
      origem_campanha: leadCompra.origem_campanha || '',
      observacoes: leadCompra.observacoes || '',
    } : {
      nome: '',
      email: '',
      telefone: '',
      idade: 25,
      genero: 'Feminino',
      cidade: '',
      valor_pago: 0,
      data_evento: new Date().toISOString().split('T')[0],
      tipo: 'Lead',
      status: 'Marcaram avaliação',
      origem_campanha: '',
      observacoes: '',
    }
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: LeadCompraFormData) => {
    try {
      await onSubmit(data);
      if (!leadCompra) {
        reset();
      }
    } catch (error) {
      console.error('Erro ao salvar lead/compra:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {leadCompra ? 'Editar Lead/Compra' : 'Novo Lead/Compra'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informações Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo
              </Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Maria Silva"
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-red-500">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="maria@exemplo.com (opcional)"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="telefone"
                {...register('telefone')}
                placeholder="912345678"
                className={errors.telefone ? 'border-red-500' : ''}
              />
              {errors.telefone && (
                <p className="text-sm text-red-500">{errors.telefone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idade">Idade</Label>
              <Input
                id="idade"
                type="number"
                {...register('idade', { valueAsNumber: true })}
                min="16"
                max="100"
                className={errors.idade ? 'border-red-500' : ''}
              />
              {errors.idade && (
                <p className="text-sm text-red-500">{errors.idade.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="genero">Gênero</Label>
              <Select
                value={watchedValues.genero || ''}
                onValueChange={(value) => setValue('genero', value as any)}
              >
                <SelectTrigger className={errors.genero ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  {GENEROS.map((genero) => (
                    <SelectItem key={genero} value={genero}>
                      {genero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.genero && (
                <p className="text-sm text-red-500">{errors.genero.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Cidade
              </Label>
              <Input
                id="cidade"
                placeholder="Ex: Lisboa, Porto, Braga..."
                className={errors.cidade ? 'border-red-500' : ''}
                {...register('cidade')}
              />
              {errors.cidade && (
                <p className="text-sm text-red-500">{errors.cidade.message}</p>
              )}
            </div>
          </div>

          {/* Informações da Compra/Lead */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_pago" className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Valor Pago (€)
              </Label>
              <Input
                id="valor_pago"
                type="number"
                step="0.01"
                {...register('valor_pago', { valueAsNumber: true })}
                className={errors.valor_pago ? 'border-red-500' : ''}
              />
              {errors.valor_pago && (
                <p className="text-sm text-red-500">{errors.valor_pago.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_evento" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data do Evento
              </Label>
              <Input
                id="data_evento"
                type="date"
                {...register('data_evento')}
                className={errors.data_evento ? 'border-red-500' : ''}
              />
              {errors.data_evento && (
                <p className="text-sm text-red-500">{errors.data_evento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={watchedValues.tipo || ''}
                onValueChange={(value) => setValue('tipo', value as any)}
              >
                <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      Lead
                    </div>
                  </SelectItem>
                  <SelectItem value="Compra">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Compra
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-red-500">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watchedValues.status || ''}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem_campanha">Origem da Campanha</Label>
              <Input
                id="origem_campanha"
                {...register('origem_campanha')}
                placeholder="Ex: Google Ads, Facebook"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações adicionais sobre este lead/compra..."
              rows={3}
            />
          </div>

          {/* Preview das Informações */}
          {(watchedValues.nome || watchedValues.email) && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Preview</h3>
              <div className="text-sm text-blue-800">
                <p><strong>Nome:</strong> {watchedValues.nome}</p>
                <p><strong>Email:</strong> {watchedValues.email}</p>
                <p><strong>Tipo:</strong> {watchedValues.tipo}</p>
                <p><strong>Valor:</strong> €{watchedValues.valor_pago?.toFixed(2) || '0.00'}</p>
                {watchedValues.origem_campanha && (
                  <p><strong>Campanha:</strong> {watchedValues.origem_campanha}</p>
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : leadCompra ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeadCompraForm;
