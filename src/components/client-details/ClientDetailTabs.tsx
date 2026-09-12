import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClientDetailTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tabs: {
    id: string;
    label: string;
  }[];
  children: React.ReactNode;
}

export const ClientDetailTabs: React.FC<ClientDetailTabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
  children,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 mb-4 sm:mb-6">
        <TabsList className="grid grid-flow-col auto-cols-max gap-1 sm:gap-2 w-auto">
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

      <div>{children}</div>
    </Tabs>
  );
};

export default ClientDetailTabs;
