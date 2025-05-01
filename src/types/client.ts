
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
  maxSessions?: number;
}

export interface Session {
  id: string;
  clientId: string;
  date: string;
  notes: string;
  paid: boolean;
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
