import { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, RefreshCw, Filter, TrendingUp, AlertTriangle } from 'lucide-react';
import { useInvestments } from '@/hooks/useInvestments';
import { useMarketData } from '@/hooks/useMarketData';
import { InvestmentCard } from '@/components/investments/InvestmentCard';
import { InvestmentForm } from '@/components/investments/InvestmentForm';
import { PortfolioSummary } from '@/components/investments/PortfolioSummary';
import { PortfolioChart } from '@/components/investments/PortfolioChart';
import type { Investment, InvestmentFormData, InvestmentType } from '@/types/investments';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const InvestmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<InvestmentType | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);

  const {
    investments,
    isLoading: investmentsLoading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    updatePrices,
    getPortfolioSummary,
  } = useInvestments();

  const {
    marketData,
    isLoading: marketLoading,
    lastUpdated,
    error: marketError,
    refreshData,
  } = useMarketData(investments);

  useEffect(() => {
    document.title = 'Investimentos | NeuroBalance';
  }, []);

  useEffect(() => {
    if (marketData.length > 0) updatePrices(marketData);
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
    setInvestmentToDelete(id);
  };

  const confirmDeleteInvestment = () => {
    if (!investmentToDelete) return;
    deleteInvestment(investmentToDelete);
    setInvestmentToDelete(null);
  };

  const handleRefreshPrices = async () => {
    if (investments.length === 0) return;
    const result = await refreshData();
    if (result.error) {
      toast.error(result.error);
    } else if (result.quotes.length === 0) {
      toast.error('Preços de mercado não disponíveis de momento.');
    } else {
      toast.success('Preços atualizados.');
    }
  };

  const filteredInvestments = investments.filter(investment => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      investment.name.toLowerCase().includes(search) ||
      investment.symbol.toLowerCase().includes(search);
    const matchesType = typeFilter === 'all' || investment.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const portfolioSummary = getPortfolioSummary();

  if (investmentsLoading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-9 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Portefólio de Investimentos"
          description="Acompanhe e faça a gestão dos seus investimentos em tempo real"
          icon={<TrendingUp className="h-5 w-5" />}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshPrices}
                disabled={marketLoading || investments.length === 0}
                className="gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', marketLoading && 'animate-spin')} />
                <span className="hidden sm:inline">Atualizar preços</span>
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setEditingInvestment(null);
                  setIsFormOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Investimento</span>
              </Button>
            </>
          }
        />

        {investments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum investimento encontrado</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Comece por adicionar o seu primeiro investimento para acompanhar a performance do
                portefólio.
              </p>
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Investimento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <PortfolioSummary summary={portfolioSummary} />

            <PortfolioChart investments={investments} />

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar investimentos..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80"
                  />
                </div>

                <Select
                  value={typeFilter}
                  onValueChange={(value: string) => setTypeFilter(value as InvestmentType | 'all')}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="crypto">Criptomoedas</SelectItem>
                    <SelectItem value="stock">Ações</SelectItem>
                    <SelectItem value="etf">ETFs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(lastUpdated || marketError) && (
                <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                  {lastUpdated && (
                    <p className="text-sm text-muted-foreground">
                      Última atualização: {lastUpdated.toLocaleTimeString('pt-PT')}
                    </p>
                  )}
                  {marketError && (
                    <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {marketError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {filteredInvestments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {filteredInvestments.map(investment => (
                  <InvestmentCard
                    key={investment.id}
                    investment={investment}
                    onEdit={handleEditInvestment}
                    onDelete={handleDeleteInvestment}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Nenhum investimento encontrado com os filtros aplicados.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('all');
                    }}
                  >
                    Limpar filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <InvestmentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={editingInvestment ? handleUpdateInvestment : handleAddInvestment}
        investment={editingInvestment}
      />

      <ConfirmDialog
        open={investmentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setInvestmentToDelete(null);
        }}
        onConfirm={confirmDeleteInvestment}
        title="Remover investimento"
        description="Tem a certeza que deseja remover este investimento? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
      />
    </PageLayout>
  );
};

export default InvestmentsPage;
