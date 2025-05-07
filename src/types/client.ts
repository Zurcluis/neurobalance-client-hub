export interface ClientDetailData {
  id: string;
  name: string;
  email: string;
  phone: string;
  sessionCount: number;
  nextSession: string | null;
  totalPaid: number;
  address?: string;
  notes?: string;
  birthday?: string;
  genero?: 'Homem' | 'Mulher' | 'Outro' | null;
  maxSessions?: number;
  status?: 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'call';
  tipoContato?: 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook';
  comoConheceu?: 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação';
}

export interface Session {
  id: string;
  clientId: string;
  date: string;
  notes: string;
  paid: boolean;
  terapeuta?: string;
  arquivos?: string[];
  type?: string;
  status?: string;
  duracao?: number;
  endDate?: string;
}

export interface MonitorableSession extends Session {
  source: 'calendar' | 'manual';
  calendarTitle?: string;
  type?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  date: string;
  amount: number;
  description: string;
  method: string;
}

export interface ClientFile {
  id: string;
  clientId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: string;
}

export interface Communication {
  id: string;
  clientId: string;
  clientName: string;
  type: 'sms' | 'email' | 'call';
  subject: string;
  message: string;
  date: string;
  status: string;
}

export interface ClientMood {
  id: string;
  clientId: string;
  mood: string;
  sleepQuality?: string;
  notes?: string;
  date: string;
}

export interface Language {
  key: string;
  label: string;
}
