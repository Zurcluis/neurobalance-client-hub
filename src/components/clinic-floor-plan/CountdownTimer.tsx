import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate?: string;
  isCleaning?: boolean;
  className?: string;
  showIcon?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  isCleaning = false,
  className = '',
  showIcon = true,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft('');
      setIsOverdue(false);
      setIsUrgent(false);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsOverdue(true);
        setIsUrgent(true);
        const overdueDifference = Math.abs(difference);
        const minutes = Math.floor((overdueDifference / 1000 / 60) % 60);
        const hours = Math.floor((overdueDifference / (1000 * 60 * 60)) % 24);
        setTimeLeft(`+${hours > 0 ? `${hours}h ` : ''}${minutes}m`);
      } else {
        setIsOverdue(false);
        const totalMinutes = Math.floor(difference / 1000 / 60);
        setIsUrgent(totalMinutes <= 5);

        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 10000); // update every 10 seconds

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate || !timeLeft) return null;

  if (isCleaning) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900 tabular-nums', className)}>
        {showIcon && <Sparkles className="h-3 w-3 text-purple-600 animate-spin" style={{ animationDuration: '4s' }} />}
        <span>{timeLeft} restantes</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold transition-all tabular-nums',
        isOverdue
          ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
          : isUrgent
          ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
          : 'bg-card text-muted-foreground border',
        className
      )}
    >
      {showIcon && (
        isOverdue ? (
          <AlertTriangle className="h-3 w-3 text-red-600 animate-bounce" />
        ) : (
          <Clock className={cn('h-3 w-3', isUrgent ? 'text-amber-600' : 'text-muted-foreground')} />
        )
      )}
      <span>{timeLeft} {isOverdue ? 'excedido' : 'restante'}</span>
    </div>
  );
};

