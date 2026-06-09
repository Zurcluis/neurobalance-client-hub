import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft('');
      setIsOverdue(false);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsOverdue(true);
        const overdueDifference = Math.abs(difference);
        const minutes = Math.floor((overdueDifference / 1000 / 60) % 60);
        const hours = Math.floor((overdueDifference / (1000 * 60 * 60)) % 24);
        setTimeLeft(`+ ${hours > 0 ? `${hours}h ` : ''}${minutes}m`);
      } else {
        setIsOverdue(false);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        setTimeLeft(`${hours > 0 ? `${hours}h ` : ''}${minutes}m`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate || !timeLeft) return null;

  return (
    <div className={`flex items-center gap-1 text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{timeLeft} {isOverdue ? 'atraso' : 'restante'}</span>
    </div>
  );
};
