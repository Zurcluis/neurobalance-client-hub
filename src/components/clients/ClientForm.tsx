
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

export interface ClientFormData {
  nome: string;
  id: string;
  idade: number;
  problematica: string;
  email: string;
  contato: string;
  localidade: string;
  dataNascimento?: string;
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
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    defaultValues
  });

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
          <Label htmlFor="idade">Idade</Label>
          <Input
            id="idade"
            type="number"
            {...register('idade', { valueAsNumber: true })}
            placeholder="Idade"
          />
        </div>
        
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contato">Contacto</Label>
          <Input
            id="contato"
            {...register('contato')}
            placeholder="Número de contacto"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
          <Input
            id="dataNascimento"
            type="date"
            {...register('dataNascimento')}
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
          <Select {...register('tipoContato')}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de contacto" />
            </SelectTrigger>
            <SelectContent>
              {['Lead', 'Contato', 'Email', 'Instagram', 'Facebook'].map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comoConheceu">Como teve conhecimento</Label>
          <Select {...register('comoConheceu')}>
            <SelectTrigger>
              <SelectValue placeholder="Como conheceu a clínica?" />
            </SelectTrigger>
            <SelectContent>
              {['Anúncio', 'Instagram', 'Facebook', 'Recomendação'].map((fonte) => (
                <SelectItem key={fonte} value={fonte}>{fonte}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <Select {...register('estado')} defaultValue="On Going">
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
