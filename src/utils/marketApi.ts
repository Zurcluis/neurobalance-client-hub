import axios from 'axios';
import type { MarketQuote } from '@/types/investments';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1';

export const QUOTE_CACHE_TTL_MS = 5 * 60 * 1000;
const FX_CACHE_KEY = 'neurobalance-usd-eur-rate';
const FX_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  ADA: 'cardano',
  DOT: 'polkadot',
  MATIC: 'polygon',
  SOL: 'solana',
  AVAX: 'avalanche-2',
  ATOM: 'cosmos',
  LINK: 'chainlink',
  UNI: 'uniswap',
};

interface FxCache {
  rate: number;
  date: string;
  fetchedAt: number;
}

let fxRatePromise: Promise<number | null> | null = null;

const readFxCache = (): FxCache | null => {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxCache;
    if (typeof parsed.rate === 'number' && typeof parsed.fetchedAt === 'number') {
      return parsed;
    }
  } catch (error) {
    console.error('Erro ao ler taxa de câmbio em cache:', error);
  }
  return null;
};

export const getUsdEurRate = (): Promise<number | null> => {
  if (fxRatePromise) return fxRatePromise;

  const promise = (async () => {
    const cached = readFxCache();
    const today = new Date().toISOString().slice(0, 10);
    if (cached && cached.date === today) return cached.rate;

    try {
      const { data } = await axios.get<{ date?: string; rates?: { EUR?: number } }>(
        `${FRANKFURTER_BASE}/latest`,
        { params: { base: 'USD', symbols: 'EUR' }, timeout: REQUEST_TIMEOUT_MS }
      );
      const rate = data?.rates?.EUR;
      if (typeof rate === 'number' && rate > 0) {
        const cache: FxCache = { rate, date: data?.date ?? today, fetchedAt: Date.now() };
        try {
          localStorage.setItem(FX_CACHE_KEY, JSON.stringify(cache));
        } catch (error) {
          console.error('Erro ao guardar taxa de câmbio em cache:', error);
        }
        return rate;
      }
    } catch (error) {
      console.error('Erro ao obter taxa USD/EUR:', error);
    }

    if (cached && Date.now() - cached.fetchedAt < FX_MAX_AGE_MS) return cached.rate;
    return null;
  })();

  fxRatePromise = promise;
  void promise.then(rate => {
    if (rate === null) fxRatePromise = null;
  });
  return promise;
};

export const isMarketApiKeyConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_MARKET_DATA_API_KEY);

export const fetchCryptoQuotes = async (symbols: string[]): Promise<MarketQuote[]> => {
  if (symbols.length === 0) return [];

  const ids = symbols.map(symbol => COINGECKO_IDS[symbol.toUpperCase()] ?? symbol.toLowerCase());
  const { data } = await axios.get<
    Record<string, { usd?: number; usd_24h_change?: number; last_updated_at?: number }>
  >(`${COINGECKO_BASE}/simple/price`, {
    params: {
      ids: ids.join(','),
      vs_currencies: 'usd',
      include_24hr_change: true,
      include_last_updated_at: true,
    },
    timeout: REQUEST_TIMEOUT_MS,
  });

  return symbols
    .map((symbol, index) => {
      const entry = data?.[ids[index]];
      const price = entry?.usd;
      if (typeof price !== 'number' || price <= 0) return null;

      const changePercent = entry?.usd_24h_change ?? 0;
      const previousPrice =
        changePercent <= -100 ? 0 : price / (1 + changePercent / 100);
      const lastUpdated = entry?.last_updated_at
        ? new Date(entry.last_updated_at * 1000).toISOString()
        : new Date().toISOString();

      return {
        symbol,
        price,
        change24h: price - previousPrice,
        changePercent24h: changePercent,
        currency: 'USD',
        lastUpdated,
      } satisfies MarketQuote;
    })
    .filter((quote): quote is MarketQuote => quote !== null);
};

interface FinnhubQuoteResponse {
  c?: number;
  d?: number;
  dp?: number;
  t?: number;
}

export const fetchStockEtfQuotes = async (symbols: string[]): Promise<MarketQuote[]> => {
  if (symbols.length === 0) return [];

  const apiKey = import.meta.env.VITE_MARKET_DATA_API_KEY;
  if (!apiKey) return [];

  let authFailed = false;

  const quotes = await Promise.all(
    symbols.map(async symbol => {
      try {
        const { data } = await axios.get<FinnhubQuoteResponse>(`${FINNHUB_BASE}/quote`, {
          params: { symbol, token: apiKey },
          timeout: REQUEST_TIMEOUT_MS,
        });

        const price = data?.c;
        if (typeof price !== 'number' || price <= 0) return null;

        return {
          symbol,
          price,
          change24h: data?.d ?? 0,
          changePercent24h: data?.dp ?? 0,
          currency: 'USD',
          lastUpdated: data?.t ? new Date(data.t * 1000).toISOString() : new Date().toISOString(),
        } satisfies MarketQuote;
      } catch (error) {
        if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
          authFailed = true;
        } else {
          console.error(`Erro ao obter cotação de ${symbol}:`, error);
        }
        return null;
      }
    })
  );

  if (authFailed) {
    throw new Error('Chave da API de cotações inválida ou expirada.');
  }

  return quotes.filter((quote): quote is MarketQuote => quote !== null);
};
