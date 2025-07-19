import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClientDetailTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tabs: {
    id: string;
    label: string;
    content: React.ReactNode;
  }[];
}

export const ClientDetailTabs: React.FC<ClientDetailTabsProps> = ({
  activeTab,
  onTabChange,
  tabs
}) => {
  const isMobile = useIsMobile();

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="relative overflow-hidden mb-4 sm:mb-6">
        <div className="overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          <TabsList 
            className="grid grid-flow-col auto-cols-max gap-1 sm:gap-2 w-auto border-neurobalance-tertiary no-scrollbar"
            style={{ minWidth: isMobile ? 'auto' : 'auto' }}
          >
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors hover:bg-neurobalance-tertiary/50 data-[state=active]:bg-neurobalance-primary data-[state=active]:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="absolute inset-y-0 right-0 w-8 sm:w-10 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
      </div>
      
      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id} className="outline-none focus-visible:ring-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ClientDetailTabs; 