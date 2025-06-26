import { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/types/client';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  languages: Language[];
  translations: Record<string, Record<string, string>>;
  t: (key: string) => string;
};

// Default translations
const translations = {
  en: {
    // Dashboard
    dashboard: 'Dashboard',
    recentClients: 'Recent Clients',
    todayAppointments: 'Today\'s Appointments',
    revenue: 'Revenue',
    sessions: 'Sessions',
    clients: 'Clients',
    viewAll: 'View All',
    noAppointments: 'No appointments for today',
    noClients: 'No clients found',
    
    // Clients
    clientsManage: 'Manage client information',
    addClient: 'Add Client',
    searchClients: 'Search clients...',
    phone: 'Phone',
    sessionCount: 'Sessions',
    totalPaid: 'Total Paid',
    nextSession: 'Next session:',
    viewProfile: 'View Profile',
    ongoing: 'Ongoing',
    thinking: 'Thinking',
    noNeed: 'No Need',
    finished: 'Finished',
    call: 'Call',
    
    // Client Details
    back: 'Back',
    profile: 'Profile',
    payments: 'Payments',
    files: 'Files',
    reports: 'Reports',
    mood: 'Mood',
    
    // Sessions
    sessionHistory: 'Session History',
    setTotalSessions: 'Set Total Sessions',
    addSession: 'Add Session',
    completeProcess: 'Complete Process',
    sessionProgress: 'Session Progress',
    scheduledSessions: 'scheduled sessions',
    plannedTotal: 'planned total',
    upcomingSessions: 'Upcoming Sessions',
    completedSessions: 'Completed Sessions',
    
    // Calendar
    calendar: 'Calendar',
    manageAppointments: 'Manage appointments and client schedules',
    newAppointment: 'New Appointment',
    todayEvents: 'Today\'s Events',
    selectDate: 'Select a date to view appointments',
    noAppointmentsToday: 'No appointments for today',
    appointmentTypes: 'Appointment Types',
    initialAssessment: 'Initial Assessment',
    resultsDiscussion: 'Results Discussion',
    edit: 'Edit',
    delete: 'Delete',
    
    // Finances
    finances: 'Finances',
    financialReports: 'Financial Reports',
    totalRevenue: 'Total Revenue',
    averagePayment: 'Average Payment',
    paymentMethod: 'Payment Method',
    recentPayments: 'Recent Payments',
    paymentHistory: 'Payment History',
    export: 'Export',
    refresh: 'Refresh',
    monthlyRevenue: 'Monthly Revenue',
    paymentMethods: 'Payment Methods',
    topClients: 'Top Clients by Revenue',
    noPayments: 'No payments found',
    
    // Other
    settings: 'Settings',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    search: 'Search',
    noResults: 'No results found',
    
    // Communications
    messages: 'Messages',
    email: 'Email',
    communications: 'Communications',
    system: 'System',
  },
  pt: {
    // Dashboard
    dashboard: 'Painel',
    recentClients: 'Clientes Recentes',
    todayAppointments: 'Agendamentos de Hoje',
    revenue: 'Receita',
    sessions: 'Sessões',
    clients: 'Clientes',
    viewAll: 'Ver Todos',
    noAppointments: 'Sem agendamentos para hoje',
    noClients: 'Nenhum cliente encontrado',
    
    // Clients
    clientsManage: 'Gerir informações dos clientes',
    addClient: 'Adicionar Cliente',
    searchClients: 'Pesquisar clientes...',
    phone: 'Telefone',
    sessionCount: 'Sessões',
    totalPaid: 'Total Pago',
    nextSession: 'Próxima sessão:',
    viewProfile: 'Ver Perfil',
    ongoing: 'Em Progresso',
    thinking: 'Em Consideração',
    noNeed: 'Sem Necessidade',
    finished: 'Concluídos',
    call: 'Contactar',
    
    // Client Details
    back: 'Voltar',
    profile: 'Perfil',
    payments: 'Pagamentos',
    files: 'Ficheiros',
    reports: 'Relatórios',
    mood: 'Estado Emocional',
    
    // Sessions
    sessionHistory: 'Histórico de Sessões',
    setTotalSessions: 'Definir Total de Sessões',
    addSession: 'Adicionar Sessão',
    completeProcess: 'Concluir Processo',
    sessionProgress: 'Progresso das Sessões',
    scheduledSessions: 'sessões agendadas',
    plannedTotal: 'sessões planeadas no total',
    upcomingSessions: 'Próximas Sessões Agendadas',
    completedSessions: 'Sessões Realizadas',
    
    // Calendar
    calendar: 'Calendário',
    manageAppointments: 'Gerencie consultas e agendamentos dos clientes',
    newAppointment: 'Novo Agendamento',
    todayEvents: 'Eventos do dia',
    selectDate: 'Selecione uma data para ver os agendamentos',
    noAppointmentsToday: 'Sem agendamentos para este dia',
    appointmentTypes: 'Tipos de Eventos',
    initialAssessment: 'Avaliação Inicial',
    resultsDiscussion: 'Discussão de resultados',
    edit: 'Editar',
    delete: 'Apagar',

    // Finances
    finances: 'Finanças',
    financialReports: 'Relatórios Financeiros',
    totalRevenue: 'Receita Total',
    averagePayment: 'Pagamento Médio',
    paymentMethod: 'Método de Pagamento',
    recentPayments: 'Pagamentos Recentes',
    paymentHistory: 'Histórico de Pagamentos',
    export: 'Exportar',
    refresh: 'Atualizar',
    monthlyRevenue: 'Receita Mensal',
    paymentMethods: 'Métodos de Pagamento',
    topClients: 'Maiores Clientes por Receita',
    noPayments: 'Nenhum pagamento encontrado',
    
    // Other
    settings: 'Definições',
    logout: 'Sair',
    darkMode: 'Modo Escuro',
    lightMode: 'Modo Claro',
    search: 'Pesquisar',
    noResults: 'Nenhum resultado encontrado',
    
    // Communications
    messages: 'Mensagens',
    email: 'Email',
    communications: 'Comunicações',
    system: 'Sistema',
  }
};

const languages: Language[] = [
  { key: 'pt', label: 'Português' },
  { key: 'en', label: 'English' },
];

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  setLanguage: () => {},
  languages,
  translations,
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Simple translation function
  const t = (key: string): string => {
    const currentTranslations = translations[language as keyof typeof translations] || {};
    return currentTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages, translations, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

export default useLanguage;
