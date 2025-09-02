import { useState, useEffect } from 'react';
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

  const updatePrices = (marketData: MarketData[]) => {
    const updatedInvestments = investments.map(investment => {
      const marketPrice = marketData.find(data => 
        data.symbol.toLowerCase() === investment.symbol.toLowerCase()
      );
      
      if (marketPrice) {
        return {
          ...investment,
          currentPrice: marketPrice.price
        };
      }
      
      return investment;
    });

    setInvestments(updatedInvestments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInvestments));
  };

  const getPortfolioSummary = (): PortfolioSummary => {
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.buyPrice), 0);
    const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    const totalPnL = totalValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    const investmentsWithPnL = investments.map(inv => {
      const pnl = (inv.currentPrice - inv.buyPrice) * inv.quantity;
      return { ...inv, pnl };
    });

    const topGainer = investmentsWithPnL.reduce((max, inv) => 
      inv.pnl > (max?.pnl || -Infinity) ? inv : max, investmentsWithPnL[0]
    );

    const topLoser = investmentsWithPnL.reduce((min, inv) => 
      inv.pnl < (min?.pnl || Infinity) ? inv : min, investmentsWithPnL[0]
    );

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercent,
      topGainer,
      topLoser
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
