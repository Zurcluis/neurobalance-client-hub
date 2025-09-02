import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  children,
  className,
  headerClassName,
  contentClassName,
  icon
}) => {
  return (
    <Card className={cn(
      "w-full transition-all duration-200 hover:shadow-md",
      "border border-gray-200 dark:border-gray-800",
      "bg-white dark:bg-gray-900",
      className
    )}>
      {title && (
        <CardHeader className={cn(
          "pb-3 px-4 sm:px-6",
          headerClassName
        )}>
          <CardTitle className={cn(
            "text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100",
            "flex items-center gap-2"
          )}>
            {icon && <span className="text-[#3f9094]">{icon}</span>}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(
        "px-4 sm:px-6 pb-4 sm:pb-6",
        !title && "pt-4 sm:pt-6",
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};
