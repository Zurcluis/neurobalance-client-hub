export type AdminRole = 'admin' | 'assistant';

export interface AdminSession {
  token: string;
  adminId: number;
  adminName: string;
  adminEmail: string;
  role: AdminRole;
  permissions: string[];
  expiresAt: string;
  isValid: boolean;
}

export interface AdminAuthRequest {
  email: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  admin?: {
    id: number;
    nome: string;
    email: string;
    role: AdminRole;
    permissions?: string[];
  };
  expiresAt?: string;
  error?: string;
}

export interface Admin {
  id: number;
  nome: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminToken {
  id: number;
  id_admin: number;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  user_agent?: string;
  ip_address?: string;
  admin: {
    nome: string;
    email: string;
    role: AdminRole;
  };
}

export interface AdminDashboardStats {
  totalClients: number;
  todayAppointments: number;
  weekAppointments: number;
  activeClients: number;
  pendingAppointments: number;
}

export const ADMIN_PERMISSIONS = {
  VIEW_CLIENTS: 'view_clients',
  EDIT_CLIENTS: 'edit_clients',
  VIEW_CALENDAR: 'view_calendar',
  EDIT_CALENDAR: 'edit_calendar',
  MANAGE_APPOINTMENTS: 'manage_appointments',
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];
