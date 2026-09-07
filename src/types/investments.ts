export type InvestmentType = 'crypto' | 'stock' | 'etf';

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes?: string;
}

export interface InvestmentFormData {
  symbol: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  buyPrice: number;
  purchaseDate: string;
  notes?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  topGainer?: Investment & { pnl: number };
  topLoser?: Investment & { pnl: number };
}

export interface CryptoApiResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    last_updated_at: number;
  };
}

export interface StockApiResponse {
  'Global Quote': {
    '01. symbol': string;
    '05. price': string;
    '09. change': string;
    '10. change percent': string;
  };
}
