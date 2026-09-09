import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickCardProps {
  icon: ReactNode;
  tint: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const QuickCard = ({ icon, tint, title, description, actionLabel, onAction }: QuickCardProps) => (
  <Card>
    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tint)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-medium leading-none">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 self-start sm:self-auto"
        onClick={onAction}
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </CardContent>
  </Card>
);

export default QuickCard;
