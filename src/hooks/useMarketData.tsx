import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Investment, InvestmentType, MarketData, MarketQuote } from '@/types/investments';
import {
  QUOTE_CACHE_TTL_MS,
  fetchCryptoQuotes,
  fetchStockEtfQuotes,
  getUsdEurRate,
  isMarketApiKeyConfigured,
} from '@/utils/marketApi';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface CycleResult {
  quotes: MarketData[];
  error: string | null;
}

interface CycleCache {
  key: string;
  fetchedAt: number;
  promise: Promise<CycleResult>;
}

let cycleCache: CycleCache | null = null;

const toSymbolKey = (investments: Investment[]): string =>
  investments
    .map(inv => `${inv.type}:${inv.symbol.toUpperCase()}`)
    .sort()
    .join('|');

const convertToEur = (quote: MarketQuote, rate: number): MarketData => ({
  symbol: quote.symbol,
  price: quote.price * rate,
  change24h: quote.change24h * rate,
  changePercent24h: quote.changePercent24h,
  currency: 'EUR',
  lastUpdated: quote.lastUpdated,
});

const buildCycle = async (investments: Investment[]): Promise<CycleResult> => {
  const symbolsByType = (type: InvestmentType) =>
    investments.filter(inv => inv.type === type).map(inv => inv.symbol.toUpperCase());

  const cryptoSymbols = symbolsByType('crypto');
  const marketSymbols = [...symbolsByType('stock'), ...symbolsByType('etf')];
  const issues: string[] = [];

  let cryptoError: string | null = null;
  let marketError: string | null = null;

  const [cryptoResult, marketResult, usdEurRate] = await Promise.all([
    fetchCryptoQuotes(cryptoSymbols).catch((error: unknown) => {
      cryptoError = 'Não foi possível obter cotações de criptomoedas.';
      console.error('Erro ao buscar dados crypto:', error);
      return null;
    }),
    fetchStockEtfQuotes(marketSymbols).catch((error: unknown) => {
      marketError =
        error instanceof Error && error.message
          ? error.message
          : 'Não foi possível obter cotações de ações/ETFs.';
      return null;
    }),
    getUsdEurRate(),
  ]);

  if (cryptoSymbols.length > 0 && !cryptoResult && cryptoError) {
    issues.push(cryptoError);
  }
  if (marketSymbols.length > 0 && !marketResult && marketError) {
    issues.push(marketError);
  }
  if (marketSymbols.length > 0 && !isMarketApiKeyConfigured()) {
    issues.push(
      'Cotações de ações/ETFs indisponíveis: configure a variável VITE_MARKET_DATA_API_KEY.'
    );
  }
  if (usdEurRate === null) {
    issues.push('Taxa de câmbio USD/EUR indisponível.');
  }

  const rate = usdEurRate ?? 0;
  const quotes = [cryptoResult ?? [], marketResult ?? []]
    .flat()
    .filter(() => rate > 0)
    .map(quote => convertToEur(quote, rate));

  return { quotes, error: issues.length > 0 ? issues.join(' ') : null };
};

const fetchQuotesCycle = (investments: Investment[], force: boolean): Promise<CycleResult> => {
  const key = toSymbolKey(investments);
  if (
    !force &&
    cycleCache &&
    cycleCache.key === key &&
    Date.now() - cycleCache.fetchedAt < QUOTE_CACHE_TTL_MS
  ) {
    return cycleCache.promise;
  }

  const promise = buildCycle(investments);
  cycleCache = { key, fetchedAt: Date.now(), promise };
  return promise;
};

export const useMarketData = (investments: Investment[]) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const investmentsRef = useRef<Investment[]>(investments);
  useEffect(() => {
    investmentsRef.current = investments;
  });

  const symbolsKey = useMemo(() => toSymbolKey(investments), [investments]);

  const runCycle = useCallback(async (options: { force: boolean; silent: boolean }) => {
    if (investmentsRef.current.length === 0) {
      return { quotes: [], error: null };
    }

    if (!options.silent) setIsLoading(true);
    try {
      const result = await fetchQuotesCycle(investmentsRef.current, options.force);

      setMarketData(previous => {
        const bySymbol = new Map(previous.map(data => [data.symbol, data]));
        for (const quote of result.quotes) bySymbol.set(quote.symbol, quote);
        return Array.from(bySymbol.values());
      });
      if (result.quotes.length > 0) setLastUpdated(new Date());

      setError(result.error);
      if (result.error && !options.silent) {
        toast.error(result.error);
      }

      return result;
    } finally {
      if (!options.silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!symbolsKey) {
      setMarketData([]);
      setError(null);
      return;
    }
    void runCycle({ force: false, silent: false });
  }, [symbolsKey, runCycle]);

  useEffect(() => {
    if (!symbolsKey) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void runCycle({ force: false, silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [symbolsKey, runCycle]);

  const refreshData = useCallback(
    () => runCycle({ force: true, silent: false }),
    [runCycle]
  );

  return { marketData, isLoading, lastUpdated, error, refreshData };
};
