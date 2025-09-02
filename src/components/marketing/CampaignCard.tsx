import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketingCampaign, MESES } from '@/types/marketing';
import { 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Euro,
  Target,
  Handshake,
  ShoppingCart,
  BarChart3
} from 'lucide-react';

interface CampaignCardProps {
  campaign: MarketingCampaign;
  onEdit: (campaign: MarketingCampaign) => void;
  onDelete: (id: string) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onEdit,
  onDelete
}) => {
  const mesNome = MESES.find(m => m.valor === campaign.mes)?.nome || 'N/A';
  const roi = campaign.investimento > 0 ? ((campaign.receita - campaign.investimento) / campaign.investimento) * 100 : 0;
  const roas = campaign.investimento > 0 ? campaign.receita / campaign.investimento : 0;

  const getOrigemColor = (origem: string) => {
    const colors: { [key: string]: string } = {
      'Google Ads': 'bg-blue-100 text-blue-800',
      'Facebook Ads': 'bg-blue-100 text-blue-800',
      'Instagram Ads': 'bg-pink-100 text-pink-800',
      'LinkedIn Ads': 'bg-blue-100 text-blue-800',
      'TikTok Ads': 'bg-black text-white',
      'YouTube Ads': 'bg-red-100 text-red-800',
      'Orgânico Google': 'bg-green-100 text-green-800',
      'Orgânico Facebook': 'bg-green-100 text-green-800',
      'Email Marketing': 'bg-purple-100 text-purple-800',
      'Referência': 'bg-orange-100 text-orange-800',
      'Direto': 'bg-gray-100 text-gray-800',
      'Outros': 'bg-gray-100 text-gray-800'
    };
    return colors[origem] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {campaign.name}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getOrigemColor(campaign.origem)}>
                {campaign.origem}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{mesNome} {campaign.ano}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(campaign)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(campaign.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Euro className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Investimento</span>
            </div>
            <p className="text-lg font-bold text-blue-900">
              {formatCurrency(campaign.investimento)}
            </p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Euro className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Receita</span>
            </div>
            <p className="text-lg font-bold text-green-900">
              {formatCurrency(campaign.receita)}
            </p>
          </div>
        </div>

        {/* Métricas de Performance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-600">Leads</p>
              <p className="font-semibold">{campaign.leads}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-600">Reuniões</p>
              <p className="font-semibold">{campaign.reunioes}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-600">Vendas</p>
              <p className="font-semibold">{campaign.vendas}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-600">Conversão</p>
              <p className="font-semibold">{formatPercentage(campaign.taxa_conversao)}</p>
            </div>
          </div>
        </div>

        {/* Métricas de Custo */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600 text-xs">CPL (Custo por Lead)</p>
            <p className="font-semibold">{formatCurrency(campaign.cpl)}</p>
          </div>
          
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-600 text-xs">CAC (Custo por Cliente)</p>
            <p className="font-semibold">{formatCurrency(campaign.cac)}</p>
          </div>
        </div>

        {/* ROI e ROAS */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <div className="text-sm">
              <span className="text-gray-600">ROI: </span>
              <span className={`font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi >= 0 ? (
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="inline h-3 w-3 mr-1" />
                )}
                {formatPercentage(roi)}
              </span>
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-600">ROAS: </span>
            <span className="font-semibold">{roas.toFixed(2)}x</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignCard;
