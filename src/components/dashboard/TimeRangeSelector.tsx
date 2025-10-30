import React, { useState } from 'react';
import { Filter, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  className?: string;
}

const getTimeRangeOptions = (t: (key: string) => string): TimeRangeOption[] => [
  { value: '7d', label: t('last7Days') },
  { value: '30d', label: t('last30Days') },
  { value: '90d', label: t('last90Days') },
  { value: '1y', label: t('lastYear') },
  { value: 'all', label: t('allData') },
];

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  
  const timeRangeOptions = getTimeRangeOptions(t);
  const selectedOption = timeRangeOptions.find(option => option.value === selectedRange);

  const handleSelect = (range: TimeRange) => {
    onRangeChange(range);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-200",
          "min-w-[160px] justify-between px-3 py-2 h-10"
        )}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {selectedOption?.label || 'Selecionar período'}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-500 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className={cn(
            "absolute top-full left-0 mt-1 z-20",
            "bg-white border border-gray-200 rounded-lg shadow-lg",
            "min-w-full py-1"
          )}>
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm",
                  "hover:bg-gray-50 transition-colors duration-150",
                  "first:rounded-t-lg last:rounded-b-lg",
                  selectedRange === option.value && "bg-green-50 text-green-700"
                )}
              >
                <span className="font-medium">{option.label}</span>
                {selectedRange === option.value && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TimeRangeSelector;
