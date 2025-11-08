import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, RefreshCw, Filter, TrendingUp, BarChart3 } from 'lucide-react';
import { useInvestments } from '@/hooks/useInvestments';
import { useMarketData } from '@/hooks/useMarketData';
import { InvestmentCard } from '@/components/investments/InvestmentCard';
import { InvestmentForm } from '@/components/investments/InvestmentForm';
import { PortfolioSummary } from '@/components/investments/PortfolioSummary';
import { PortfolioChart } from '@/components/investments/PortfolioChart';
import { Investment, InvestmentFormData, InvestmentType } from '@/types/investments';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const InvestmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<InvestmentType | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  
  const {
    investments,
    isLoading: investmentsLoading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    updatePrices,
    getPortfolioSummary
  } = useInvestments();

  const {
    marketData,
    isLoading: marketLoading,
    lastUpdated,
    fetchMarketData,
    refreshData
  } = useMarketData();

  const isMobile = useIsMobile();

  useEffect(() => {
    if (investments.length > 0) {
      fetchMarketData(investments);
    }
  }, [investments, fetchMarketData]);

  useEffect(() => {
    if (marketData.length > 0) {
      updatePrices(marketData);
    }
  }, [marketData, updatePrices]);

  const handleAddInvestment = (data: InvestmentFormData) => {
    addInvestment(data);
    setIsFormOpen(false);
  };

  const handleEditInvestment = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsFormOpen(true);
  };

  const handleUpdateInvestment = (data: InvestmentFormData) => {
    if (editingInvestment) {
      updateInvestment(editingInvestment.id, data);
      setEditingInvestment(null);
      setIsFormOpen(false);
    }
  };

  const handleDeleteInvestment = (id: string) => {
    if (confirm('Tem certeza que deseja remover este investimento?')) {
      deleteInvestment(id);
    }
  };

  const handleRefreshPrices = async () => {
    if (investments.length > 0) {
      toast.info('Atualizando preços...');
      await refreshData(investments);
      toast.success('Preços atualizados!');
    }
  };

  const filteredInvestments = investments.filter(investment => {
    const matchesSearch = investment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investment.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || investment.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const portfolioSummary = getPortfolioSummary();

  const getTypeStats = () => {
    const stats = {
      crypto: { count: 0, value: 0 },
      stock: { count: 0, value: 0 },
      etf: { count: 0, value: 0 }
    };

    investments.forEach(inv => {
      stats[inv.type].count++;
      stats[inv.type].value += inv.quantity * inv.currentPrice;
    });

    return stats;
  };

  const typeStats = getTypeStats();

  if (investmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f9094] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando investimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className={cn(
        "flex-1 transition-all duration-300",
        isMobile ? "ml-0" : "ml-64"
      )}>
        <div className={cn(
          "p-6 space-y-6",
          isMobile && "pt-20"
        )}>
          {/* Header Melhorado */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3f9094] to-[#2A5854] bg-clip-text text-transparent">
                Portfólio de Investimentos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Acompanhe e gerencie seus investimentos em tempo real
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPrices}
                disabled={marketLoading || investments.length === 0}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", marketLoading && "animate-spin")} />
                {!isMobile && "Atualizar Preços"}
              </Button>
              
              <Button
                onClick={() => {
                  setEditingInvestment(null);
                  setIsFormOpen(true);
                }}
                className="bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {!isMobile && "Novo Investimento"}
              </Button>
            </div>
          </div>

          {/* Portfolio Summary */}
          {investments.length > 0 && (
            <PortfolioSummary summary={portfolioSummary} />
          )}

          {/* Portfolio Charts */}
          {investments.length > 0 && (
            <PortfolioChart investments={investments} />
          )}

          {/* Type Statistics */}
          {investments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Criptomoedas</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {typeStats.crypto.count}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        €{typeStats.crypto.value.toFixed(2)}
                      </p>
                    </div>
                    <Badge className="bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                      Crypto
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Ações</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {typeStats.stock.count}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        €{typeStats.stock.value.toFixed(2)}
                      </p>
                    </div>
                    <Badge className="bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                      Stocks
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300">ETFs</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {typeStats.etf.count}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        €{typeStats.etf.value.toFixed(2)}
                      </p>
                    </div>
                    <Badge className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                      ETFs
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar investimentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={(value: string) => setTypeFilter(value as InvestmentType | 'all')}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="stock">Ações</SelectItem>
                  <SelectItem value="etf">ETFs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {lastUpdated && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Última atualização: {lastUpdated.toLocaleTimeString('pt-PT')}
              </div>
            )}
          </div>

          {/* Investments Grid */}
          {filteredInvestments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvestments.map((investment) => (
                <InvestmentCard
                  key={investment.id}
                  investment={investment}
                  onEdit={handleEditInvestment}
                  onDelete={handleDeleteInvestment}
                />
              ))}
            </div>
          ) : investments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Nenhum investimento encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece adicionando seu primeiro investimento para acompanhar sua performance.
                </p>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-[#3f9094] hover:bg-[#2d7a7e]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Investimento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum investimento encontrado com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Investment Form Dialog */}
      <InvestmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={editingInvestment ? handleUpdateInvestment : handleAddInvestment}
        investment={editingInvestment}
      />
    </div>
  );
};

export default InvestmentsPage;
