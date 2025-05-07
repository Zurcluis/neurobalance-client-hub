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
  id: string;
  idade?: number;
  problematica: string;
  email: string;
  contato: string;
  localidade: string;
  dataNascimento?: Date | null;
  genero?: 'Homem' | 'Mulher' | 'Outro';
  tipoContato: 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook';
  comoConheceu: 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação';
  estado: 'On Going' | 'Thinking' | 'No need' | 'Finished' | 'call';
  notes?: string;
  numeroSessoes?: number;
  valorPacote?: number;
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  defaultValues?: Partial<ClientFormData>;
  isEditing?: boolean;
}

const ClientForm = ({ onSubmit, defaultValues = {}, isEditing = false }: ClientFormProps) => {
  const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<ClientFormData>({
    defaultValues: {
      tipoContato: 'Lead',
      comoConheceu: 'Anúncio',
      estado: 'On Going',
      ...defaultValues,
      dataNascimento: defaultValues.dataNascimento ? new Date(defaultValues.dataNascimento) : null,
    }
  });
  const [birthDate, setBirthDate] = useState<Date | null>(
    defaultValues.dataNascimento ? new Date(defaultValues.dataNascimento) : null
  );
  const [statusValue, setStatusValue] = useState<'On Going' | 'Thinking' | 'No need' | 'Finished' | 'call'>(
    (defaultValues.estado as any) || 'On Going'
  );
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit({
      ...data,
      dataNascimento: data.dataNascimento instanceof Date ? data.dataNascimento : birthDate,
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
          <Label htmlFor="id" className="text-base">ID <span className="text-red-500">*</span></Label>
          <Input
            id="id"
            type="text"
            {...register('id', {
              required: 'ID é obrigatório'
            })}
            placeholder="ID do cliente"
            disabled={isEditing}
            className={`h-11 text-base ${errors.id ? 'border-red-500' : ''}`}
          />
          {errors.id && (
            <p className="text-sm text-red-500">{errors.id.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataNascimento" className="text-base">Data de Nascimento</Label>
          <Controller
            control={control}
            name="dataNascimento"
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
                className="h-11 text-base w-full rounded-md border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            )}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="genero" className="text-base">Género</Label>
          <Controller
            control={control}
            name="genero"
            render={({ field }) => (
          <Select 
                onValueChange={field.onChange}
                value={field.value}
            defaultValue={defaultValues.genero}
          >
                <SelectTrigger className="h-11 text-base">
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email', {
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
        
        <div className="space-y-2">
          <Label htmlFor="contato" className="text-base">Contacto</Label>
          <Input
            id="contato"
            type="tel"
            inputMode="tel"
            {...register('contato')}
            placeholder="Número de contacto"
            className="h-11 text-base"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="localidade" className="text-base">Localidade</Label>
        <Input
          id="localidade"
          {...register('localidade')}
          placeholder="Localidade"
          className="h-11 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problematica" className="text-base">Problemática</Label>
        <Textarea
          id="problematica"
          {...register('problematica')}
          placeholder="Descreva a problemática do cliente"
          className="min-h-[100px] sm:min-h-[120px] text-base pt-2 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipoContato" className="text-base">Tipo de Contacto</Label>
          <Controller
            control={control}
            name="tipoContato"
            render={({ field }) => (
          <Select 
                onValueChange={field.onChange}
                value={field.value}
            defaultValue={defaultValues.tipoContato || 'Lead'}
          >
                <SelectTrigger className="h-11 text-base">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="comoConheceu" className="text-base">Como teve conhecimento</Label>
          <Controller
            control={control}
            name="comoConheceu"
            render={({ field }) => (
          <Select 
                onValueChange={field.onChange}
                value={field.value}
            defaultValue={defaultValues.comoConheceu || 'Anúncio'}
          >
                <SelectTrigger className="h-11 text-base">
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
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado" className="text-base">Estado</Label>
        <Controller
          control={control}
          name="estado"
          render={({ field }) => (
        <Select 
              onValueChange={(value: any) => {
                field.onChange(value);
                setStatusValue(value);
              }}
              value={field.value}
          defaultValue={defaultValues.estado || 'On Going'}
        >
              <SelectTrigger className="h-11 text-base">
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="On Going">On Going</SelectItem>
            <SelectItem value="Thinking">Thinking</SelectItem>
            <SelectItem value="No need">No Need</SelectItem>
            <SelectItem value="Finished">Finished</SelectItem>
            <SelectItem value="call">Call</SelectItem>
          </SelectContent>
        </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">Notas/Observações</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Observações adicionais"
          className="min-h-[80px] sm:min-h-[100px] text-base pt-2 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <Label htmlFor="numeroSessoes" className="text-base">Pacote de Sessões</Label>
          <Input
            id="numeroSessoes"
            type="number"
            min="0"
            {...register('numeroSessoes', {
              valueAsNumber: true,
              validate: (value) => 
                (value === undefined || value === null || isNaN(value) || value >= 0) || 
                'O número deve ser positivo'
            })}
            placeholder="Número de sessões"
            className="h-11 text-base"
          />
          {errors.numeroSessoes && (
            <p className="text-sm text-red-500">{errors.numeroSessoes.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="valorPacote" className="text-base">Valor do Pacote (€)</Label>
          <Input
            id="valorPacote"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            {...register('valorPacote', {
              valueAsNumber: true,
              validate: (value) => 
                (value === undefined || value === null || isNaN(value) || value >= 0) || 
                'O valor deve ser positivo'
            })}
            placeholder="Valor (€)"
            className="h-11 text-base"
          />
          {errors.valorPacote && (
            <p className="text-sm text-red-500">{errors.valorPacote.message}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-4 flex-col sm:flex-row">
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
