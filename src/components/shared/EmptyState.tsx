import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
    variant?: 'default' | 'outline' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  illustration?: string;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {illustration ? (
        <img 
          src={illustration} 
          alt={title} 
          className="w-64 h-64 mb-6 object-contain"
          loading="lazy"
        />
      ) : icon ? (
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
          <div className="text-primary/60">
            {icon}
          </div>
        </div>
      ) : null}
      
      <h3 className="text-xl font-semibold mb-2 text-foreground">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <Button 
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className="gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button 
            onClick={secondaryAction.onClick}
            variant="outline"
            className="gap-2"
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};

