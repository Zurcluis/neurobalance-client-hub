import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskBand } from '@/utils/clientInsights';
import { RISK_BAND_LABEL } from '@/utils/clientInsights';

const bandClasses: Record<RiskBand, string> = {
  baixo: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  atencao: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  risco: 'bg-destructive/10 text-destructive border-destructive/30',
};

interface RiskBadgeProps {
  band: RiskBand;
  className?: string;
}

const RiskBadge = ({ band, className }: RiskBadgeProps) => (
  <Badge variant="outline" className={cn('font-medium', bandClasses[band], className)}>
    {RISK_BAND_LABEL[band]}
  </Badge>
);

export default RiskBadge;
