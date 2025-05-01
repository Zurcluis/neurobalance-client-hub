
import React from 'react';
import Sidebar from "./Sidebar";
import { useIsMobile } from '@/hooks/use-mobile';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isMobile ? 'pt-20 px-4 pb-8' : 'p-8 ml-64'}`}>
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
