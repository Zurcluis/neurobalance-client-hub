import React from 'react';
import Sidebar from "./Sidebar";
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

interface PageLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
}

const PageLayout = ({ children, showBreadcrumbs = true }: PageLayoutProps) => {
  const isMobile = useIsMobile();
  const { isPortrait } = useScreenSize();

  return (
    <div className="flex min-h-screen bg-[#E6ECEA] dark:bg-gray-900">
      <Sidebar />
      <main 
        id="main-content"
        tabIndex={-1}
        role="main"
        aria-label="Conteúdo principal"
        className={`flex-1 transition-all duration-300 focus:outline-none ${
          isMobile 
            ? `pt-20 px-4 pb-8 ${isPortrait ? 'pb-safe' : ''}` 
            : 'p-8 ml-64'
        }`}
      >
        <div className="max-w-[1600px] mx-auto">
          {showBreadcrumbs && !isMobile && (
            <div className="mb-4">
              <Breadcrumbs />
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
