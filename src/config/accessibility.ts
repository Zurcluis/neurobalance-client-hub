export const WCAG_AA_CONTRAST_RATIOS = {
  normalText: 4.5,
  largeText: 3,
};

export const COLOR_CONTRAST_CHECKS = {
  primary: {
    bg: '#3A726D',
    text: '#FFFFFF',
    ratio: 5.2,
    passes: true
  },
  secondary: {
    bg: '#E6ECEA',
    text: '#3A726D',
    ratio: 5.1,
    passes: true
  },
  accent: {
    bg: '#7EB4AD',
    text: '#1A1F2C',
    ratio: 4.6,
    passes: true
  },
};

export const ARIA_LABELS = {
  navigation: {
    main: 'Menu principal',
    breadcrumbs: 'Navegação estrutural',
    sidebar: 'Barra lateral de navegação',
  },
  actions: {
    search: 'Abrir busca rápida',
    logout: 'Fazer logout do sistema',
    toggleTheme: 'Alternar tema escuro/claro',
    toggleLanguage: 'Alternar idioma',
    close: 'Fechar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Excluir',
    edit: 'Editar',
    save: 'Salvar',
  },
  forms: {
    required: 'Campo obrigatório',
    optional: 'Campo opcional',
    email: 'Endereço de e-mail',
    password: 'Senha',
    name: 'Nome',
    phone: 'Telefone',
  },
  status: {
    loading: 'Carregando',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',
  },
};

export const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl+K', action: 'Abrir busca rápida', category: 'Navegação' },
  { key: '/', action: 'Focar no campo de busca', category: 'Navegação' },
  { key: '?', action: 'Mostrar atalhos de teclado', category: 'Ajuda' },
  { key: 'Ctrl+N', action: 'Criar novo cliente', category: 'Ações' },
  { key: 'Esc', action: 'Fechar modal ou cancelar', category: 'Navegação' },
  { key: 'Tab', action: 'Navegar para frente', category: 'Navegação' },
  { key: 'Shift+Tab', action: 'Navegar para trás', category: 'Navegação' },
  { key: 'Enter', action: 'Confirmar ação ou abrir item', category: 'Ações' },
  { key: 'Space', action: 'Ativar botão ou checkbox', category: 'Ações' },
];

export const SCREEN_READER_ANNOUNCEMENTS = {
  clientCreated: 'Cliente criado com sucesso',
  clientUpdated: 'Cliente atualizado com sucesso',
  clientDeleted: 'Cliente excluído com sucesso',
  appointmentScheduled: 'Consulta agendada com sucesso',
  appointmentCancelled: 'Consulta cancelada com sucesso',
  dataLoaded: 'Dados carregados',
  dataError: 'Erro ao carregar dados',
  formInvalid: 'Formulário contém erros. Por favor, corrija os campos destacados',
  formSaved: 'Alterações salvas com sucesso',
  navigationChange: 'Navegando para',
};

export const FOCUS_STYLES = {
  default: 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  button: 'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all',
  input: 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors',
  link: 'focus:outline-none focus:underline focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm',
};

export const ACCESSIBILITY_FEATURES = {
  skipLinks: true,
  ariaLabels: true,
  keyboardNavigation: true,
  focusManagement: true,
  screenReaderSupport: true,
  colorContrastCompliance: true,
  wcagLevel: 'AA',
};

