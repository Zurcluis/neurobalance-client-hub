import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import MarketingSidebar from '@/components/marketing/MarketingSidebar';
import MarketingReportsPage from '@/pages/MarketingReportsPage';
import { MarketingContext } from '@/contexts/MarketingContext';

const MarketingAreaPage: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <MarketingContext.Provider value={{ isMarketingContext: true }}>
      <div className="flex min-h-screen bg-gray-50">
        <MarketingSidebar />
        
        <main className={cn(
          "flex-1 transition-all duration-300",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className={cn(
            "p-6 space-y-6",
            isMobile && "pt-20"
          )}>
            <MarketingReportsPage />
          </div>
        </main>
      </div>
    </MarketingContext.Provider>
  );
};

export default MarketingAreaPage;
