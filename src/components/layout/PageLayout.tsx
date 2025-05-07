import React from 'react';
import Sidebar from "./Sidebar";
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  const isMobile = useIsMobile();
  const { isPortrait } = useScreenSize();

  return (
    <div className="flex min-h-screen bg-[#E6ECEA] dark:bg-gray-900">
      <Sidebar />
      <main 
        className={`flex-1 transition-all duration-300 ${
          isMobile 
            ? `pt-20 px-4 pb-8 ${isPortrait ? 'pb-safe' : ''}` 
            : 'p-8 ml-64'
        }`}
      >
        <div className="max-w-[1600px] mx-auto">
        {children}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
