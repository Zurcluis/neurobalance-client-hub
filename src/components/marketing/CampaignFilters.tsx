import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignFilters, ORIGENS_CAMPANHA, MESES } from '@/types/marketing';
import { Filter, X, Calendar, BarChart3 } from 'lucide-react';

interface CampaignFiltersProps {
  filters: CampaignFilters;
  onFiltersChange: (filters: CampaignFilters) => void;
  onClearFilters: () => void;
}

const CampaignFiltersComponent: React.FC<CampaignFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const updateFilter = (key: keyof CampaignFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtros de Campanhas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros por Origem */}
        <div className="space-y-2">
          <Label htmlFor="origem-filter">Origem da Campanha</Label>
          <Select
            value={filters.origem || 'todas'}
            onValueChange={(value) => updateFilter('origem', value === 'todas' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as origens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as origens</SelectItem>
              {ORIGENS_CAMPANHA.map((origem) => (
                <SelectItem key={origem} value={origem}>
                  {origem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Período - Data Início */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Período Inicial
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={filters.mesInicio?.toString() || 'qualquer'}
                onValueChange={(value) => updateFilter('mesInicio', value === 'qualquer' ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualquer">Qualquer</SelectItem>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor.toString()}>
                      {mes.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.anoInicio?.toString() || 'qualquer'}
                onValueChange={(value) => updateFilter('anoInicio', value === 'qualquer' ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualquer">Qualquer</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Período - Data Fim */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Período Final
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={filters.mesFim?.toString() || 'qualquer'}
                onValueChange={(value) => updateFilter('mesFim', value === 'qualquer' ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualquer">Qualquer</SelectItem>
                  {MESES.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor.toString()}>
                      {mes.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.anoFim?.toString() || 'qualquer'}
                onValueChange={(value) => updateFilter('anoFim', value === 'qualquer' ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualquer">Qualquer</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Ordenação */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Ordenar Por
            </Label>
            <Select
              value={filters.ordenarPor || 'data'}
              onValueChange={(value) => updateFilter('ordenarPor', value === 'data' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Data (mais recente)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data">Data (mais recente)</SelectItem>
                <SelectItem value="nome">Nome da Campanha</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
                <SelectItem value="leads">Número de Leads</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="roi">ROI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ordem</Label>
            <Select
              value={filters.ordem || 'desc'}
              onValueChange={(value) => updateFilter('ordem', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Decrescente</SelectItem>
                <SelectItem value="asc">Crescente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Todos os Filtros
            </Button>
          </div>
        )}

        {/* Resumo dos Filtros Ativos */}
        {hasActiveFilters && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Filtros Ativos:</p>
            <div className="flex flex-wrap gap-2">
              {filters.origem && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Origem: {filters.origem}
                </span>
              )}
              {(filters.mesInicio || filters.anoInicio) && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Início: {filters.mesInicio ? MESES.find(m => m.valor === filters.mesInicio)?.nome : 'Qualquer'} {filters.anoInicio || 'Qualquer'}
                </span>
              )}
              {(filters.mesFim || filters.anoFim) && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Fim: {filters.mesFim ? MESES.find(m => m.valor === filters.mesFim)?.nome : 'Qualquer'} {filters.anoFim || 'Qualquer'}
                </span>
              )}
              {filters.ordenarPor && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Ordenar: {filters.ordenarPor} ({filters.ordem === 'asc' ? 'Crescente' : 'Decrescente'})
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignFiltersComponent;
