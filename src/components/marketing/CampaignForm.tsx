import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketingCampaign, ORIGENS_CAMPANHA, MESES } from '@/types/marketing';
import { Calculator, Save, X } from 'lucide-react';

const campaignSchema = z.object({
  name: z.string().min(1, 'Nome da campanha é obrigatório'),
  origem: z.string().min(1, 'Origem é obrigatória'),
  mes: z.number().min(1).max(12),
  ano: z.number().min(2020).max(2030),
  investimento: z.number().min(0, 'Investimento deve ser positivo'),
  leads: z.number().min(0, 'Leads deve ser positivo'),
  reunioes: z.number().min(0, 'Reuniões deve ser positivo'),
  vendas: z.number().min(0, 'Vendas deve ser positivo'),
  receita: z.number().min(0, 'Receita deve ser positiva'),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignFormProps {
  campaign?: MarketingCampaign;
  onSubmit: (data: CampaignFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  campaign,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: campaign ? {
      name: campaign.name,
      origem: campaign.origem,
      mes: campaign.mes,
      ano: campaign.ano,
      investimento: campaign.investimento,
      leads: campaign.leads,
      reunioes: campaign.reunioes,
      vendas: campaign.vendas,
      receita: campaign.receita,
    } : {
      mes: currentMonth,
      ano: currentYear,
      investimento: 0,
      leads: 0,
      reunioes: 0,
      vendas: 0,
      receita: 0,
    }
  });

  const watchedValues = watch();

  // Cálculo automático de métricas
  const calculatedMetrics = React.useMemo(() => {
    const { investimento, leads, vendas, receita } = watchedValues;
    
    const cpl = leads > 0 ? investimento / leads : 0;
    const cac = vendas > 0 ? investimento / vendas : 0;
    const taxaConversao = leads > 0 ? (vendas / leads) * 100 : 0;
    const roi = investimento > 0 ? ((receita - investimento) / investimento) * 100 : 0;
    const roas = investimento > 0 ? receita / investimento : 0;

    return {
      cpl: Math.round(cpl * 100) / 100,
      cac: Math.round(cac * 100) / 100,
      taxaConversao: Math.round(taxaConversao * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      roas: Math.round(roas * 100) / 100
    };
  }, [watchedValues]);

  const handleFormSubmit = async (data: CampaignFormData) => {
    try {
      await onSubmit(data);
      if (!campaign) {
        reset();
      }
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {campaign ? 'Editar Campanha' : 'Nova Campanha de Marketing'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Black Friday - Google Ads"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem</Label>
              <Select
                value={watchedValues.origem || ''}
                onValueChange={(value) => setValue('origem', value)}
              >
                <SelectTrigger className={errors.origem ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS_CAMPANHA.map((origem) => (
                    <SelectItem key={origem} value={origem}>
                      {origem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.origem && (
                <p className="text-sm text-red-500">{errors.origem.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mes">Mês</Label>
              <Select
                value={watchedValues.mes?.toString() || ''}
                onValueChange={(value) => setValue('mes', parseInt(value))}
              >
                <SelectTrigger className={errors.mes ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor.toString()}>
                      {mes.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mes && (
                <p className="text-sm text-red-500">{errors.mes.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                {...register('ano', { valueAsNumber: true })}
                min="2020"
                max="2030"
                className={errors.ano ? 'border-red-500' : ''}
              />
              {errors.ano && (
                <p className="text-sm text-red-500">{errors.ano.message}</p>
              )}
            </div>
          </div>

          {/* Métricas de Investimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="investimento">Investimento (€)</Label>
              <Input
                id="investimento"
                type="number"
                step="0.01"
                {...register('investimento', { valueAsNumber: true })}
                className={errors.investimento ? 'border-red-500' : ''}
              />
              {errors.investimento && (
                <p className="text-sm text-red-500">{errors.investimento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="leads">Leads Gerados</Label>
              <Input
                id="leads"
                type="number"
                {...register('leads', { valueAsNumber: true })}
                className={errors.leads ? 'border-red-500' : ''}
              />
              {errors.leads && (
                <p className="text-sm text-red-500">{errors.leads.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reunioes">Reuniões Agendadas</Label>
              <Input
                id="reunioes"
                type="number"
                {...register('reunioes', { valueAsNumber: true })}
                className={errors.reunioes ? 'border-red-500' : ''}
              />
              {errors.reunioes && (
                <p className="text-sm text-red-500">{errors.reunioes.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendas">Vendas Fechadas</Label>
              <Input
                id="vendas"
                type="number"
                {...register('vendas', { valueAsNumber: true })}
                className={errors.vendas ? 'border-red-500' : ''}
              />
              {errors.vendas && (
                <p className="text-sm text-red-500">{errors.vendas.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="receita">Receita Gerada (€)</Label>
              <Input
                id="receita"
                type="number"
                step="0.01"
                {...register('receita', { valueAsNumber: true })}
                className={errors.receita ? 'border-red-500' : ''}
              />
              {errors.receita && (
                <p className="text-sm text-red-500">{errors.receita.message}</p>
              )}
            </div>
          </div>

          {/* Métricas Calculadas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Métricas Calculadas Automaticamente</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-600">CPL:</span>
                <p className="font-medium">€{calculatedMetrics.cpl}</p>
              </div>
              <div>
                <span className="text-gray-600">CAC:</span>
                <p className="font-medium">€{calculatedMetrics.cac}</p>
              </div>
              <div>
                <span className="text-gray-600">Taxa Conversão:</span>
                <p className="font-medium">{calculatedMetrics.taxaConversao}%</p>
              </div>
              <div>
                <span className="text-gray-600">ROI:</span>
                <p className={`font-medium ${calculatedMetrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculatedMetrics.roi}%
                </p>
              </div>
              <div>
                <span className="text-gray-600">ROAS:</span>
                <p className="font-medium">{calculatedMetrics.roas}x</p>
              </div>
            </div>
          </div>

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
              {isLoading ? 'Salvando...' : campaign ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CampaignForm;
