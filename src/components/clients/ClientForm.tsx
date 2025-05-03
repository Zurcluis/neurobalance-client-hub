
import React from 'react';
import { useForm } from 'react-hook-form';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from "lucide-react";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface ClientFormData {
  nome: string;
  id: string;
  idade?: number;
  problematica: string;
  email: string;
  contato: string;
  localidade: string;
  dataNascimento?: string;
  genero?: 'Homem' | 'Mulher' | 'Outro';
  tipoContato: 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook';
  comoConheceu: 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação';
  estado: 'On Going' | 'Thinking' | 'No need' | 'Finished' | 'call';
  notes?: string;
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  defaultValues?: Partial<ClientFormData>;
  isEditing?: boolean;
}

const ClientForm = ({ onSubmit, defaultValues = {}, isEditing = false }: ClientFormProps) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ClientFormData>({
    defaultValues: {
      tipoContato: 'Lead',
      comoConheceu: 'Anúncio',
      estado: 'On Going',
      ...defaultValues
    }
  });

  const selectedDate = watch('dataNascimento');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            {...register('nome', { required: 'Nome é obrigatório' })}
            placeholder="Nome do cliente"
            className={errors.nome ? 'border-red-500' : ''}
          />
          {errors.nome && (
            <p className="text-sm text-red-500">{errors.nome.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input
            id="id"
            {...register('id', { required: 'ID é obrigatório' })}
            placeholder="ID do cliente"
            className={errors.id ? 'border-red-500' : ''}
          />
          {errors.id && (
            <p className="text-sm text-red-500">{errors.id.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(new Date(selectedDate), 'dd/MM/yyyy') : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(date) => setValue('dataNascimento', date ? format(date, 'yyyy-MM-dd') : undefined)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="genero">Género</Label>
          <Select 
            onValueChange={(value) => setValue('genero', value as 'Homem' | 'Mulher' | 'Outro')} 
            defaultValue={defaultValues.genero}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o género" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Homem">Homem</SelectItem>
              <SelectItem value="Mulher">Mulher</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contato">Contacto</Label>
          <Input
            id="contato"
            {...register('contato')}
            placeholder="Número de contacto"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="localidade">Localidade</Label>
        <Input
          id="localidade"
          {...register('localidade')}
          placeholder="Localidade"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problematica">Problemática</Label>
        <Textarea
          id="problematica"
          {...register('problematica')}
          placeholder="Descreva a problemática do cliente"
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipoContato">Tipo de Contacto</Label>
          <Select 
            onValueChange={(value) => setValue('tipoContato', value as 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook')} 
            defaultValue={defaultValues.tipoContato || 'Lead'}
          >
            <SelectTrigger>
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="comoConheceu">Como teve conhecimento</Label>
          <Select 
            onValueChange={(value) => setValue('comoConheceu', value as 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação')} 
            defaultValue={defaultValues.comoConheceu || 'Anúncio'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Como conheceu a clínica?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Anúncio">Anúncio</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="Recomendação">Recomendação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <Select 
          onValueChange={(value) => setValue('estado', value as 'On Going' | 'Thinking' | 'No need' | 'Finished' | 'call')} 
          defaultValue={defaultValues.estado || 'On Going'}
        >
          <SelectTrigger>
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
      </div>

      <Button 
        type="submit" 
        className="bg-[#3A726D] hover:bg-[#265255] text-white w-full"
      >
        {isEditing ? 'Atualizar Cliente' : 'Adicionar Cliente'}
      </Button>
    </form>
  );
};

export default ClientForm;
