import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ClientAvailability,
  NewClientAvailability,
  AvailabilityFormSchema,
  AvailabilityFormData,
  DIAS_SEMANA,
  PREFERENCIA_HORARIO,
  RECORRENCIA,
  STATUS_DISPONIBILIDADE,
} from '@/types/availability';

interface AvailabilityFormProps {
  clienteId: number;
  availability?: ClientAvailability;
  onSubmit: (data: NewClientAvailability) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  clienteId,
  availability,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AvailabilityFormData>({
    resolver: zodResolver(AvailabilityFormSchema),
    defaultValues: availability
      ? {
          dia_semana: availability.dia_semana,
          hora_inicio: availability.hora_inicio,
          hora_fim: availability.hora_fim,
          preferencia: availability.preferencia,
          recorrencia: availability.recorrencia,
          status: availability.status,
          valido_de: availability.valido_de || undefined,
          valido_ate: availability.valido_ate || undefined,
          notas: availability.notas || undefined,
        }
      : {
          dia_semana: 1,
          hora_inicio: '09:00',
          hora_fim: '10:00',
          preferencia: 'media',
          recorrencia: 'semanal',
          status: 'ativo',
        },
  });

  const watchStatus = watch('status');
  const isTemporario = watchStatus === 'temporario';

  const handleFormSubmit = async (data: AvailabilityFormData) => {
    const submitData: NewClientAvailability = {
      cliente_id: clienteId,
      dia_semana: data.dia_semana,
      hora_inicio: data.hora_inicio,
      hora_fim: data.hora_fim,
      preferencia: data.preferencia,
      recorrencia: data.recorrencia,
      status: data.status,
      valido_de: data.valido_de || null,
      valido_ate: data.valido_ate || null,
      notas: data.notas || null,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Dia da Semana */}
      <div className="space-y-2">
        <Label htmlFor="dia_semana">Dia da Semana *</Label>
        <Controller
          control={control}
          name="dia_semana"
          render={({ field }) => (
            <Select
              value={field.value.toString()}
              onValueChange={(value) => field.onChange(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DIAS_SEMANA).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.dia_semana && (
          <p className="text-sm text-red-500">{errors.dia_semana.message}</p>
        )}
      </div>

      {/* Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hora_inicio">Horário de Início *</Label>
          <Input
            id="hora_inicio"
            type="time"
            {...register('hora_inicio')}
            className={errors.hora_inicio ? 'border-red-500' : ''}
          />
          {errors.hora_inicio && (
            <p className="text-sm text-red-500">{errors.hora_inicio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hora_fim">Horário de Fim *</Label>
          <Input
            id="hora_fim"
            type="time"
            {...register('hora_fim')}
            className={errors.hora_fim ? 'border-red-500' : ''}
          />
          {errors.hora_fim && (
            <p className="text-sm text-red-500">{errors.hora_fim.message}</p>
          )}
        </div>
      </div>

      {/* Preferência */}
      <div className="space-y-2">
        <Label>Preferência *</Label>
        <Controller
          control={control}
          name="preferencia"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex flex-col md:flex-row gap-4"
            >
              {PREFERENCIA_HORARIO.map((pref) => (
                <div key={pref} className="flex items-center space-x-2">
                  <RadioGroupItem value={pref} id={`pref-${pref}`} />
                  <Label htmlFor={`pref-${pref}`} className="cursor-pointer capitalize">
                    {pref === 'alta' && '⭐'} 
                    {pref === 'media' && '◆'} 
                    {pref === 'baixa' && '○'} 
                    {' '}{pref}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        <p className="text-xs text-gray-500">
          Alta preferência = Horários que você mais prefere | 
          Média = Disponível se necessário | 
          Baixa = Última opção
        </p>
      </div>

      {/* Status e Recorrência */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_DISPONIBILIDADE.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recorrencia">Recorrência *</Label>
          <Controller
            control={control}
            name="recorrencia"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORRENCIA.map((rec) => (
                    <SelectItem key={rec} value={rec} className="capitalize">
                      {rec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Período de Validade (se temporário) */}
      {isTemporario && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="space-y-2">
            <Label htmlFor="valido_de">Válido De</Label>
            <Input
              id="valido_de"
              type="date"
              {...register('valido_de')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valido_ate">Válido Até</Label>
            <Input
              id="valido_ate"
              type="date"
              {...register('valido_ate')}
            />
          </div>
        </div>
      )}

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas">Observações (Opcional)</Label>
        <Textarea
          id="notas"
          {...register('notas')}
          placeholder="Ex: Prefiro este horário por causa do trabalho"
          rows={3}
        />
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : availability ? 'Atualizar' : 'Adicionar Horário'}
        </Button>
      </div>
    </form>
  );
};

