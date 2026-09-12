import { useState, useEffect, useCallback } from 'react';
import { Investment, InvestmentFormData, MarketData, PortfolioSummary } from '@/types/investments';
import { toast } from 'sonner';

const STORAGE_KEY = 'neurobalance-investments';

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setInvestments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erro ao carregar investimentos:', error);
      toast.error('Erro ao carregar investimentos');
    } finally {
      setIsLoading(false);
    }
  };

  const saveInvestments = (newInvestments: Investment[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newInvestments));
      setInvestments(newInvestments);
    } catch (error) {
      console.error('Erro ao salvar investimentos:', error);
      toast.error('Erro ao salvar investimentos');
    }
  };

  const addInvestment = (data: InvestmentFormData) => {
    const newInvestment: Investment = {
      id: Date.now().toString(),
      ...data,
      currentPrice: data.buyPrice, // Será atualizado pela API
    };

    const updatedInvestments = [...investments, newInvestment];
    saveInvestments(updatedInvestments);
    toast.success('Investimento adicionado com sucesso');
  };

  const updateInvestment = (id: string, data: Partial<Investment>) => {
    const updatedInvestments = investments.map(inv =>
      inv.id === id ? { ...inv, ...data } : inv
    );
    saveInvestments(updatedInvestments);
    toast.success('Investimento atualizado com sucesso');
  };

  const deleteInvestment = (id: string) => {
    const updatedInvestments = investments.filter(inv => inv.id !== id);
    saveInvestments(updatedInvestments);
    toast.success('Investimento removido com sucesso');
  };

  const updatePrices = useCallback((marketData: MarketData[]) => {
    if (marketData.length === 0) return;

    setInvestments(previous => {
      let changed = false;
      const updated = previous.map(investment => {
        const quote = marketData.find(
          data => data.symbol.toLowerCase() === investment.symbol.toLowerCase()
        );

        if (
          quote &&
          Number.isFinite(quote.price) &&
          quote.price > 0 &&
          (quote.price !== investment.currentPrice ||
            quote.lastUpdated !== investment.priceUpdatedAt)
        ) {
          changed = true;
          return {
            ...investment,
            currentPrice: quote.price,
            priceCurrency: quote.currency,
            priceUpdatedAt: quote.lastUpdated,
          };
        }

        return investment;
      });

      if (!changed) return previous;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar investimentos:', error);
      }
      return updated;
    });
  }, []);

  const getPortfolioSummary = (): PortfolioSummary => {
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.buyPrice), 0);

    const pricedInvestments = investments.filter(
      inv => Boolean(inv.priceUpdatedAt) && Number.isFinite(inv.currentPrice) && inv.currentPrice > 0
    );
    const unpricedCount = investments.length - pricedInvestments.length;

    const totalValue = pricedInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const totalPnL = pricedInvestments.reduce(
      (sum, inv) => sum + (inv.currentPrice - inv.buyPrice) * inv.quantity,
      0
    );
    const investedPriced = pricedInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.buyPrice), 0);
    const totalPnLPercent = investedPriced > 0 ? (totalPnL / investedPriced) * 100 : 0;

    const investmentsWithPnL = pricedInvestments.map(inv => {
      const pnl = (inv.currentPrice - inv.buyPrice) * inv.quantity;
      return { ...inv, pnl };
    });

    const topGainer = investmentsWithPnL.reduce<Investment & { pnl: number } | null>(
      (max, inv) => (max === null || inv.pnl > max.pnl ? inv : max),
      null
    );

    const topLoser = investmentsWithPnL.reduce<Investment & { pnl: number } | null>(
      (min, inv) => (min === null || inv.pnl < min.pnl ? inv : min),
      null
    );

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      topGainer: topGainer ?? undefined,
      topLoser: topLoser ?? undefined,
      unpricedCount
    };
  };

  return {
    investments,
    isLoading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    updatePrices,
    getPortfolioSummary
  };
};
