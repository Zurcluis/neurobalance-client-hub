
import React from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const PageLayout = ({ children, className }: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={cn(
        "flex-1 ml-64 p-8 animate-fade-in",
        className
      )}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
