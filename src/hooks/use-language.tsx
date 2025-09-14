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
    desistiu: 'Gave Up',
    
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
    
    // Marketing
    marketing: 'Marketing',
    campaigns: 'Campaigns',
    leads: 'Leads',
    leadAnalytics: 'Lead Analytics',
    import: 'Import',
    filters: 'Filters',
    newCampaign: 'New Campaign',
    newLead: 'New Lead',
    totalInvestment: 'Total Investment',
    totalLeads: 'Total Leads',
    totalMeetings: 'Total Meetings',
    totalSales: 'Total Sales',
    averageCostPerLead: 'Average Cost Per Lead',
    averageCustomerAcquisition: 'Average Customer Acquisition',
    averageConversionRate: 'Average Conversion Rate',
    roi: 'ROI',
    roas: 'ROAS',
    campaignName: 'Campaign Name',
    campaignType: 'Campaign Type',
    platform: 'Platform',
    startDate: 'Start Date',
    endDate: 'End Date',
    budget: 'Budget',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    paused: 'Paused',
    leadName: 'Lead Name',
    leadEmail: 'Lead Email',
    leadPhone: 'Lead Phone',
    leadAge: 'Age',
    leadGender: 'Gender',
    leadCity: 'City',
    leadSource: 'Source',
    leadValue: 'Value',
    leadStatus: 'Status',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    all: 'All',
    startedNeurofeedback: 'Started Neurofeedback',
    notGoingToAdvance: 'Not Going to Advance',
    willScheduleLater: 'Will Schedule Later',
    willStartButNotScheduled: 'Will Start But Not Scheduled',
    continuingNeurofeedback: 'Continuing Neurofeedback',
    missingEvaluationResults: 'Missing Evaluation Results',
    scheduledEvaluation: 'Scheduled Evaluation',
    startsLater: 'Starts Later',
    
    // Admin Management
    adminManagement: 'Admin Management',
    administrative: 'Administrative',
    adminTokens: 'Admin Tokens',
    addAdministrative: 'Add Administrative',
    editAdministrative: 'Edit Administrative',
    fullName: 'Full Name',
    dateOfBirth: 'Date of Birth',
    address: 'Address',
    contact: 'Contact',
    accessType: 'Access Type',
    activeAccount: 'Active Account',
    allowAccess: 'Allow this administrative to access the system',
    administrator: 'Administrator',
    assistant: 'Assistant',
    fullAccess: 'Full system access',
    limitedAccess: 'Limited access to clients and calendar',
    cancel: 'Cancel',
    add: 'Add',
    update: 'Update',
    delete: 'Delete',
    save: 'Save',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    
    // Time Range
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last90Days: 'Last 90 days',
    lastYear: 'Last year',
    allData: 'All data',
    
    // Statistics
    statistics: 'Statistics',
    investments: 'Investments',
    
    // Common Actions
    copy: 'Copy',
    copyLink: 'Copy Link',
    sendEmail: 'Send Email',
    revoke: 'Revoke',
    renew: 'Renew',
    deactivate: 'Deactivate',
    activate: 'Activate',
    create: 'Create',
    generate: 'Generate',
    clear: 'Clear',
    reset: 'Reset',
    submit: 'Submit',
    continue: 'Continue',
    finish: 'Finish',
    next: 'Next',
    previous: 'Previous',
    
    // Status
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    inProgress: 'In Progress',
    scheduled: 'Scheduled',
    expired: 'Expired',
    valid: 'Valid',
    invalid: 'Invalid',
  },
  pt: {
    // Dashboard
    dashboard: 'Dashboard',
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
    desistiu: 'Desistiu',
    
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
    
    // Marketing
    marketing: 'Marketing',
    campaigns: 'Campanhas',
    leads: 'Leads',
    leadAnalytics: 'Análise de Leads',
    import: 'Importar',
    filters: 'Filtros',
    newCampaign: 'Nova Campanha',
    newLead: 'Novo Lead',
    totalInvestment: 'Investimento Total',
    totalLeads: 'Total de Leads',
    totalMeetings: 'Total de Reuniões',
    totalSales: 'Total de Vendas',
    averageCostPerLead: 'Custo Médio por Lead',
    averageCustomerAcquisition: 'Aquisição Média de Clientes',
    averageConversionRate: 'Taxa Média de Conversão',
    roi: 'ROI',
    roas: 'ROAS',
    campaignName: 'Nome da Campanha',
    campaignType: 'Tipo de Campanha',
    platform: 'Plataforma',
    startDate: 'Data de Início',
    endDate: 'Data de Fim',
    budget: 'Orçamento',
    status: 'Estado',
    active: 'Ativo',
    inactive: 'Inativo',
    paused: 'Pausado',
    leadName: 'Nome do Lead',
    leadEmail: 'Email do Lead',
    leadPhone: 'Telefone do Lead',
    leadAge: 'Idade',
    leadGender: 'Género',
    leadCity: 'Cidade',
    leadSource: 'Origem',
    leadValue: 'Valor',
    leadStatus: 'Estado',
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outro',
    all: 'Todos',
    startedNeurofeedback: 'Iniciou Neurofeedback',
    notGoingToAdvance: 'Não vai avançar',
    willScheduleLater: 'Vão marcar consulta mais à frente',
    willStartButNotScheduled: 'Vai iniciar NFB mas ainda não marcou primeira consulta',
    continuingNeurofeedback: 'Continuam Neurofeedback',
    missingEvaluationResults: 'Falta resultados da avaliação',
    scheduledEvaluation: 'Marcaram avaliação',
    startsLater: 'Começa mais tarde',
    
    // Admin Management
    adminManagement: 'Gestão Administrativa',
    administrative: 'Administrativas',
    adminTokens: 'Tokens Administrativos',
    addAdministrative: 'Adicionar Administrativa',
    editAdministrative: 'Editar Administrativa',
    fullName: 'Nome Completo',
    dateOfBirth: 'Data de Nascimento',
    address: 'Morada',
    contact: 'Contacto',
    accessType: 'Tipo de Acesso',
    activeAccount: 'Conta Ativa',
    allowAccess: 'Permitir que esta administrativa aceda ao sistema',
    administrator: 'Administradora',
    assistant: 'Assistente',
    fullAccess: 'Acesso completo ao sistema',
    limitedAccess: 'Acesso limitado a clientes e calendário',
    cancel: 'Cancelar',
    add: 'Adicionar',
    update: 'Atualizar',
    delete: 'Eliminar',
    save: 'Guardar',
    close: 'Fechar',
    confirm: 'Confirmar',
    yes: 'Sim',
    no: 'Não',
    loading: 'A carregar...',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',
    info: 'Informação',
    
    // Time Range
    last7Days: 'Últimos 7 dias',
    last30Days: 'Últimos 30 dias',
    last90Days: 'Últimos 90 dias',
    lastYear: 'Último ano',
    allData: 'Todos os dados',
    
    // Statistics
    statistics: 'Estatísticas',
    investments: 'Investimentos',
    
    // Common Actions
    copy: 'Copiar',
    copyLink: 'Copiar Link',
    sendEmail: 'Enviar Email',
    revoke: 'Revogar',
    renew: 'Renovar',
    deactivate: 'Desativar',
    activate: 'Ativar',
    create: 'Criar',
    generate: 'Gerar',
    clear: 'Limpar',
    reset: 'Repor',
    submit: 'Submeter',
    continue: 'Continuar',
    finish: 'Terminar',
    next: 'Seguinte',
    previous: 'Anterior',
    
    // Status
    pending: 'Pendente',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    inProgress: 'Em Progresso',
    scheduled: 'Agendado',
    expired: 'Expirado',
    valid: 'Válido',
    invalid: 'Inválido',
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
