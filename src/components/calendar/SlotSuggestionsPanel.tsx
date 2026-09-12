import React from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarClock } from 'lucide-react';
import type { SlotSuggestion } from '@/utils/slotSuggestions';

interface SlotSuggestionsPanelProps {
  title: string;
  description?: string;
  suggestions: SlotSuggestion[];
  onSelect: (suggestion: SlotSuggestion) => void;
  emptyMessage?: string;
}

const SlotSuggestionsPanel: React.FC<SlotSuggestionsPanelProps> = ({
  title,
  description,
  suggestions,
  onSelect,
  emptyMessage,
}) => {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground border border-border rounded-md p-3 bg-muted/40">
          {emptyMessage || 'Sem histórico suficiente para sugerir horários.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={`${format(suggestion.date, 'yyyy-MM-dd')}T${suggestion.time}`}
              type="button"
              onClick={() => onSelect(suggestion)}
              className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-left transition-colors hover:bg-accent"
            >
              <CalendarClock className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-medium capitalize">
                  {format(suggestion.date, "eeee, dd/MM 'às'", { locale: pt })} {suggestion.time}
                </span>
                <span className="block text-xs text-muted-foreground truncate">{suggestion.reason}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SlotSuggestionsPanel;
