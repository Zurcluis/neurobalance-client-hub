
import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function LanguageSwitch() {
  const { language, setLanguage, languages } = useLanguage();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map(lang => (
          <DropdownMenuItem 
            key={lang.key}
            onClick={() => setLanguage(lang.key)}
            className={language === lang.key ? 'bg-accent text-accent-foreground' : ''}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
