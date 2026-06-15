import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LANDING_LEAD_STATUS, LandingLeadStatus, LANDING_LEAD_ORIGEM, LandingLead } from '@/types/landing-lead';
import { User, Mail, Phone, MapPin, Save, X } from 'lucide-react';

const landingLeadSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  status: z.enum(LANDING_LEAD_STATUS, { required_error: 'Selecione o status' }),
  origem: z.enum(LANDING_LEAD_ORIGEM, { required_error: 'Selecione a origem' }).or(z.string()),
  morada: z.string().optional(),
  observacoes: z.string().optional(),
});

type LandingLeadFormData = z.infer<typeof landingLeadSchema>;

interface LandingLeadFormProps {
  onSubmit: (data: LandingLeadFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: LandingLead;
}

export const LandingLeadForm: React.FC<LandingLeadFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<LandingLeadFormData>({
    resolver: zodResolver(landingLeadSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      email: initialData?.email || '',
      telefone: initialData?.telefone || '',
      status: initialData?.status || 'Novo',
      origem: initialData?.origem || 'Instagram',
      morada: initialData?.morada || '',
      observacoes: initialData?.observacoes || '',
    }
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: LandingLeadFormData) => {
    try {
      // Convert empty strings to undefined or null equivalent before submitting if needed
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-4">
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
          {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
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
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
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
          {errors.telefone && <p className="text-sm text-red-500">{errors.telefone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status (Kanban)</Label>
          <Select
            value={watchedValues.status || 'Novo'}
            onValueChange={(value) => setValue('status', value as LandingLeadStatus)}
          >
            <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {LANDING_LEAD_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="origem" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Como conheceu
          </Label>
          <Select
            value={watchedValues.origem || 'Instagram'}
            onValueChange={(value) => setValue('origem', value)}
          >
            <SelectTrigger className={errors.origem ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione como conheceu" />
            </SelectTrigger>
            <SelectContent>
              {LANDING_LEAD_ORIGEM.map((origem) => (
                <SelectItem key={origem} value={origem}>
                  {origem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.origem && <p className="text-sm text-red-500">{errors.origem.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="morada" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Morada
          </Label>
          <Input
            id="morada"
            placeholder="Ex: Rua Direita, nº 1"
            className={errors.morada ? 'border-red-500' : ''}
            {...register('morada')}
          />
          {errors.morada && <p className="text-sm text-red-500">{errors.morada.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações adicionais..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Adicionar ao Kanban')}
        </Button>
      </div>
    </form>
  );
};
