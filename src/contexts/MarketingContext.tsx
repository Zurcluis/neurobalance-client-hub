import { createContext, useContext } from 'react';

interface MarketingContextType {
  isMarketingContext: boolean;
}

const defaultValue: MarketingContextType = {
  isMarketingContext: false,
};

export const MarketingContext = createContext<MarketingContextType>(defaultValue);

export const useMarketingContext = (): MarketingContextType => {
  const context = useContext(MarketingContext);
  return context || defaultValue;
};
