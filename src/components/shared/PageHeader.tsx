import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="hidden sm:flex h-11 w-11 rounded-xl bg-gradient-to-br from-[#3f9094] to-[#2A5854] text-white items-center justify-center shadow-sm shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-[#3f9094] to-[#2A5854] dark:from-[#65ada7] dark:to-[#478682] bg-clip-text text-transparent truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 items-center shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
