import { useState, useEffect, useCallback } from 'react';
import { MarketData, CryptoApiResponse, StockApiResponse, Investment } from '@/types/investments';
import axios from 'axios';
import { toast } from 'sonner';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_KEY = 'demo'; // Usar uma chave real em produção

export const useMarketData = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCryptoData = async (symbols: string[]): Promise<MarketData[]> => {
    try {
      // Converter símbolos para IDs do CoinGecko (simplificado)
      const coinIds = symbols.map(symbol => {
        const mapping: { [key: string]: string } = {
          'BTC': 'bitcoin',
          'ETH': 'ethereum',
          'ADA': 'cardano',
          'DOT': 'polkadot',
          'MATIC': 'polygon',
          'SOL': 'solana',
          'AVAX': 'avalanche-2',
          'ATOM': 'cosmos',
          'LINK': 'chainlink',
          'UNI': 'uniswap'
        };
        return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
      });

      const response = await axios.get<CryptoApiResponse>(
        `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`
      );

      return coinIds.map((coinId, index) => {
        const data = response.data[coinId];
        if (!data) return null;

        return {
          symbol: symbols[index],
          price: data.usd,
          change24h: data.usd_24h_change || 0,
          changePercent24h: data.usd_24h_change || 0,
          marketCap: data.usd_market_cap,
          volume24h: data.usd_24h_vol,
          lastUpdated: new Date(data.last_updated_at * 1000).toISOString()
        };
      }).filter(Boolean) as MarketData[];
    } catch (error) {
      console.error('Erro ao buscar dados crypto:', error);
      return [];
    }
  };

  const fetchStockData = async (symbols: string[]): Promise<MarketData[]> => {
    try {
      // Para demonstração, vamos simular dados de ações
      // Em produção, usar Alpha Vantage ou outra API
      return symbols.map(symbol => ({
        symbol,
        price: Math.random() * 200 + 50, // Preço simulado
        change24h: (Math.random() - 0.5) * 10,
        changePercent24h: (Math.random() - 0.5) * 5,
        marketCap: Math.random() * 1000000000,
        volume24h: Math.random() * 10000000,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao buscar dados de ações:', error);
      return [];
    }
  };

  const fetchETFData = async (symbols: string[]): Promise<MarketData[]> => {
    try {
      // Para demonstração, vamos simular dados de ETFs
      return symbols.map(symbol => ({
        symbol,
        price: Math.random() * 100 + 20,
        change24h: (Math.random() - 0.5) * 3,
        changePercent24h: (Math.random() - 0.5) * 2,
        marketCap: Math.random() * 500000000,
        volume24h: Math.random() * 5000000,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao buscar dados de ETFs:', error);
      return [];
    }
  };

  const fetchMarketData = useCallback(async (investments: Investment[]) => {
    if (investments.length === 0) return;

    setIsLoading(true);
    try {
      const cryptoSymbols = investments
        .filter(inv => inv.type === 'crypto')
        .map(inv => inv.symbol);
      
      const stockSymbols = investments
        .filter(inv => inv.type === 'stock')
        .map(inv => inv.symbol);
      
      const etfSymbols = investments
        .filter(inv => inv.type === 'etf')
        .map(inv => inv.symbol);

      const [cryptoData, stockData, etfData] = await Promise.all([
        cryptoSymbols.length > 0 ? fetchCryptoData(cryptoSymbols) : Promise.resolve([]),
        stockSymbols.length > 0 ? fetchStockData(stockSymbols) : Promise.resolve([]),
        etfSymbols.length > 0 ? fetchETFData(etfSymbols) : Promise.resolve([])
      ]);

      const allData = [...cryptoData, ...stockData, ...etfData];
      setMarketData(allData);
      setLastUpdated(new Date());
      
      return allData;
    } catch (error) {
      console.error('Erro ao buscar dados do mercado:', error);
      toast.error('Erro ao atualizar preços do mercado');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async (investments: Investment[]) => {
    const data = await fetchMarketData(investments);
    return data;
  }, [fetchMarketData]);

  useEffect(() => {
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(() => {
      if (marketData.length > 0) {
        // Refresh apenas se houver dados
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [marketData]);

  return {
    marketData,
    isLoading,
    lastUpdated,
    fetchMarketData,
    refreshData
  };
};
