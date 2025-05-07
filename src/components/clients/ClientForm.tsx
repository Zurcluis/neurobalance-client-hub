import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon } from "lucide-react";
import { cn } from '@/lib/utils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ClientFormData {
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: Date | null;
  genero: 'Homem' | 'Mulher' | 'Outro';
  morada: string;
  notas?: string;
  estado: 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'call';
  tipo_contato: 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook';
  como_conheceu: 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação';
  numero_sessoes?: number;
  total_pago?: number;
  max_sessoes?: number;
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  defaultValues?: Partial<ClientFormData>;
  isEditing?: boolean;
}

// Update payment types array
const paymentTypes = [
  { id: 'none', label: 'Sem Pagamento', value: 0 },
  { id: 'initial', label: 'Avaliação Inicial', value: 85 },
  { id: 'second', label: 'Segunda Avaliação', value: 85 },
  { id: 'monthly', label: 'Pack Mensal Neurofeedback', value: 400 },
  { id: 'session', label: 'Sessão Individual Neurofeedback', value: 55 }
];

const ClientForm = ({ onSubmit, defaultValues = {}, isEditing = false }: ClientFormProps) => {
  const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<ClientFormData>({
    defaultValues: {
      tipo_contato: 'Lead',
      como_conheceu: 'Anúncio',
      estado: 'ongoing',
      ...defaultValues,
      data_nascimento: defaultValues.data_nascimento ? new Date(defaultValues.data_nascimento) : null,
    }
  });
  const [birthDate, setBirthDate] = useState<Date | null>(
    defaultValues.data_nascimento ? new Date(defaultValues.data_nascimento) : null
  );
  const [statusValue, setStatusValue] = useState<'ongoing' | 'thinking' | 'no-need' | 'finished' | 'call'>(
    defaultValues.estado || 'ongoing'
  );
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const isMobile = useIsMobile();

  // Add payment type change handler
  const handlePaymentTypeChange = (value: string) => {
    const selectedType = paymentTypes.find(type => type.id === value);
    if (selectedType) {
      setValue('total_pago', selectedType.value);
    }
  };

  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit({
      ...data,
      data_nascimento: data.data_nascimento instanceof Date ? data.data_nascimento : birthDate,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome" className="text-base">Nome <span className="text-red-500">*</span></Label>
          <Input
            id="nome"
            type="text"
            {...register('nome', {
              required: 'Nome é obrigatório'
            })}
            placeholder="Nome completo"
            className={`h-11 text-base ${errors.nome ? 'border-red-500' : ''}`}
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base">Email <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido'
              }
            })}
            placeholder="Email"
            className={`h-11 text-base ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefone" className="text-base">Telefone <span className="text-red-500">*</span></Label>
          <Input
            id="telefone"
            type="tel"
            {...register('telefone', {
              required: 'Telefone é obrigatório'
            })}
            placeholder="Número de telefone"
            className={`h-11 text-base ${errors.telefone ? 'border-red-500' : ''}`}
          />
          {errors.telefone && (
            <p className="text-sm text-red-500">{errors.telefone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_nascimento" className="text-base">Data de Nascimento <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="data_nascimento"
            rules={{ required: 'Data de nascimento é obrigatória' }}
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date: Date | null) => {
                  field.onChange(date);
                  setBirthDate(date);
                }}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecione a data"
                wrapperClassName="w-full"
                className={`h-11 text-base w-full rounded-md border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${errors.data_nascimento ? 'border-red-500' : ''}`}
              />
            )}
          />
          {errors.data_nascimento && (
            <p className="text-sm text-red-500">{errors.data_nascimento.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="genero" className="text-base">Género <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="genero"
            rules={{ required: 'Género é obrigatório' }}
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={defaultValues.genero}
              >
                <SelectTrigger className={`h-11 text-base ${errors.genero ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione o género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Homem">Homem</SelectItem>
                  <SelectItem value="Mulher">Mulher</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.genero && (
            <p className="text-sm text-red-500">{errors.genero.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="morada" className="text-base">Morada <span className="text-red-500">*</span></Label>
          <Input
            id="morada"
            type="text"
            {...register('morada', {
              required: 'Morada é obrigatória'
            })}
            placeholder="Morada completa"
            className={`h-11 text-base ${errors.morada ? 'border-red-500' : ''}`}
          />
          {errors.morada && (
            <p className="text-sm text-red-500">{errors.morada.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo_contato" className="text-base">Tipo de Contacto <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="tipo_contato"
            rules={{ required: 'Tipo de contacto é obrigatório' }}
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={defaultValues.tipo_contato || 'Lead'}
              >
                <SelectTrigger className={`h-11 text-base ${errors.tipo_contato ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione o tipo de contacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Contato">Contato</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.tipo_contato && (
            <p className="text-sm text-red-500">{errors.tipo_contato.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="como_conheceu" className="text-base">Como teve conhecimento <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="como_conheceu"
            rules={{ required: 'Como conheceu é obrigatório' }}
            render={({ field }) => (
              <Select 
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={defaultValues.como_conheceu || 'Anúncio'}
              >
                <SelectTrigger className={`h-11 text-base ${errors.como_conheceu ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Como conheceu a clínica?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anúncio">Anúncio</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Recomendação">Recomendação</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.como_conheceu && (
            <p className="text-sm text-red-500">{errors.como_conheceu.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado" className="text-base">Estado <span className="text-red-500">*</span></Label>
        <Controller
          control={control}
          name="estado"
          rules={{ required: 'Estado é obrigatório' }}
          render={({ field }) => (
            <Select 
              onValueChange={(value: any) => {
                field.onChange(value);
                setStatusValue(value);
              }}
              value={field.value}
              defaultValue={defaultValues.estado || 'ongoing'}
            >
              <SelectTrigger className={`h-11 text-base ${errors.estado ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">On Going</SelectItem>
                <SelectItem value="thinking">Thinking</SelectItem>
                <SelectItem value="no-need">No Need</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="call">Call</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.estado && (
          <p className="text-sm text-red-500">{errors.estado.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas" className="text-base">Notas/Observações</Label>
        <Textarea
          id="notas"
          {...register('notas')}
          placeholder="Observações adicionais"
          className="min-h-[80px] sm:min-h-[100px] text-base pt-2 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numero_sessoes" className="text-base">Número de Sessões</Label>
          <Input
            id="numero_sessoes"
            type="number"
            min="0"
            {...register('numero_sessoes', {
              valueAsNumber: true,
              validate: (value) => 
                (value === undefined || value === null || isNaN(value) || value >= 0) || 
                'O número deve ser positivo'
            })}
            placeholder="Número de sessões"
            className="h-11 text-base"
          />
          {errors.numero_sessoes && (
            <p className="text-sm text-red-500">{errors.numero_sessoes.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="payment_type" className="text-base">Tipo de Pagamento</Label>
          <Select 
            onValueChange={handlePaymentTypeChange}
            defaultValue="none"
          >
            <SelectTrigger className="h-11 text-base">
              <SelectValue placeholder="Selecione o tipo de pagamento" />
            </SelectTrigger>
            <SelectContent>
              {paymentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label} {type.value > 0 ? `(€${type.value})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {isEditing ? (
          <>
            <Button type="submit" className="w-full sm:w-auto bg-[#3A726D] hover:bg-[#2A5854] text-white h-11">
              Atualizar Cliente
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto h-11"
              onClick={() => setResetConfirmOpen(true)}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="submit" className="w-full sm:w-auto bg-[#3A726D] hover:bg-[#2A5854] text-white h-11">
            Adicionar Cliente
          </Button>
        )}
      </div>
    </form>
  );
};

export default ClientForm;
