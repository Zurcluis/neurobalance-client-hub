import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EligibleClientsSelector } from './EligibleClientsSelector';
import {
  EmailSmsCampaign,
  NewEmailSmsCampaign,
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
} from '@/types/email-sms-campaign';
import { NewEmailSmsCampaignSchema } from '@/types/email-sms-campaign';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EmailSmsCampaignFormProps {
  campaign?: EmailSmsCampaign;
  onSubmit: (data: NewEmailSmsCampaign) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EmailSmsCampaignForm: React.FC<EmailSmsCampaignFormProps> = ({
  campaign,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>(
    campaign?.clientes_ids || []
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    campaign?.template || 'personalizado'
  );
  const [campaignType, setCampaignType] = useState<'email' | 'sms'>(
    campaign?.tipo || 'email'
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewEmailSmsCampaign>({
    resolver: zodResolver(NewEmailSmsCampaignSchema),
    defaultValues: {
      nome: campaign?.nome || '',
      tipo: campaign?.tipo || 'email',
      assunto: campaign?.assunto || '',
      mensagem: campaign?.mensagem || '',
      template: campaign?.template || 'personalizado',
      status: campaign?.status || 'rascunho',
      data_envio: campaign?.data_envio || null,
      filtro_estado: campaign?.filtro_estado || [],
      filtro_tipo_contato: campaign?.filtro_tipo_contato || [],
      clientes_ids: campaign?.clientes_ids || [],
      total_clientes: campaign?.total_clientes || 0,
    },
  });

  const watchedTipo = watch('tipo');

  useEffect(() => {
    setCampaignType(watchedTipo);
  }, [watchedTipo]);

  useEffect(() => {
    setValue('clientes_ids', selectedClientIds);
    setValue('total_clientes', selectedClientIds.length);
  }, [selectedClientIds, setValue]);

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setValue('template', templateKey);

    if (campaignType === 'email' && templateKey !== 'personalizado') {
      const template = EMAIL_TEMPLATES[templateKey as keyof typeof EMAIL_TEMPLATES];
      if (template) {
        setValue('assunto', template.assunto);
        setValue('mensagem', template.mensagem);
      }
    } else if (campaignType === 'sms' && templateKey !== 'personalizado') {
      const template = SMS_TEMPLATES[templateKey as keyof typeof SMS_TEMPLATES];
      if (template) {
        setValue('mensagem', template.mensagem);
      }
    }
  };

  const handleTypeChange = (type: 'email' | 'sms') => {
    setCampaignType(type);
    setValue('tipo', type);
    if (type === 'sms') {
      setValue('assunto', '');
    }
  };

  const onFormSubmit = async (data: NewEmailSmsCampaign) => {
    await onSubmit({
      ...data,
      clientes_ids: selectedClientIds,
      total_clientes: selectedClientIds.length,
    });
  };

  const templates = campaignType === 'email' ? EMAIL_TEMPLATES : SMS_TEMPLATES;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome da Campanha *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Reativação - Janeiro 2025"
            className={errors.nome ? 'border-red-500' : ''}
          />
          {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Tipo de Campanha *</Label>
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleTypeChange(value as 'email' | 'sms');
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="cursor-pointer">
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="cursor-pointer">
                    SMS
                  </Label>
                </div>
              </RadioGroup>
            )}
          />
          {errors.tipo && <p className="text-sm text-red-500">{errors.tipo.message}</p>}
        </div>
      </div>

      {campaignType === 'email' && (
        <div className="space-y-2">
          <Label htmlFor="assunto">Assunto *</Label>
          <Input
            id="assunto"
            {...register('assunto')}
            placeholder="Assunto do email"
            className={errors.assunto ? 'border-red-500' : ''}
          />
          {errors.assunto && <p className="text-sm text-red-500">{errors.assunto.message}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="template">Template</Label>
        <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um template" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(templates).map(([key, template]) => (
              <SelectItem key={key} value={key}>
                {template.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensagem">Mensagem *</Label>
        <Textarea
          id="mensagem"
          {...register('mensagem')}
          placeholder={
            campaignType === 'email'
              ? 'Digite a mensagem do email...'
              : 'Digite a mensagem SMS (máx. 160 caracteres)...'
          }
          className={cn(
            'min-h-[200px]',
            campaignType === 'sms' && 'max-h-[150px]',
            errors.mensagem ? 'border-red-500' : ''
          )}
          maxLength={campaignType === 'sms' ? 160 : undefined}
        />
        {campaignType === 'sms' && (
          <p className="text-sm text-gray-500">
            {watch('mensagem')?.length || 0}/160 caracteres
          </p>
        )}
        {errors.mensagem && <p className="text-sm text-red-500">{errors.mensagem.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="enviando">Enviando</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Data de Envio (Opcional)</Label>
          <Controller
            control={control}
            name="data_envio"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(new Date(field.value), 'PPP', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <EligibleClientsSelector
            onSelectionChange={setSelectedClientIds}
            initialSelection={selectedClientIds}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || selectedClientIds.length === 0}>
          {isLoading ? 'Salvando...' : campaign ? 'Atualizar Campanha' : 'Criar Campanha'}
        </Button>
      </div>
    </form>
  );
};

