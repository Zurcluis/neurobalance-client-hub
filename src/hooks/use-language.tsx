
import { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types/client';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  languages: Language[];
  t: (key: string) => string;
};

const languages: Language[] = [
  { key: 'pt', label: 'Português' },
  { key: 'en', label: 'English' },
];

// Simple translations
const translations: Record<string, Record<string, string>> = {
  pt: {
    dashboard: 'Dashboard',
    clients: 'Clientes',
    calendar: 'Calendário',
    finances: 'Finanças',
    communications: 'Comunicações',
    messages: 'Mensagens',
    email: 'Email',
    call: 'Chamada',
    system: 'Sistema de Gestão de Clientes',
  },
  en: {
    dashboard: 'Dashboard',
    clients: 'Clients',
    calendar: 'Calendar',
    finances: 'Finances',
    communications: 'Communications',
    messages: 'Messages',
    email: 'Email',
    call: 'Call',
    system: 'Client Management System',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: () => {},
  languages,
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(
    localStorage.getItem('neurobalance-language') || 'pt'
  );

  const setLanguage = (lang: string) => {
    localStorage.setItem('neurobalance-language', lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};
