export interface MarketingSession {
  marketingId: string;
  marketingName: string;
  marketingEmail: string;
  role: 'marketing_manager' | 'marketing_assistant';
  permissions: string[];
  token: string;
  expiresAt: string;
}

export interface MarketingAuthRequest {
  email: string;
  token: string;
}

export interface MarketingAuthResponse {
  success: boolean;
  session?: MarketingSession;
  message?: string;
}

// Permissões específicas para Marketing
export const MARKETING_PERMISSIONS = {
  VIEW_CAMPAIGNS: 'view_campaigns',
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  VIEW_LEADS: 'view_leads',
  MANAGE_LEADS: 'manage_leads',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  VIEW_ANALYTICS: 'view_analytics',
} as const;

// Definir permissões por role
export const MARKETING_ROLE_PERMISSIONS = {
  marketing_manager: [
    MARKETING_PERMISSIONS.VIEW_CAMPAIGNS,
    MARKETING_PERMISSIONS.MANAGE_CAMPAIGNS,
    MARKETING_PERMISSIONS.VIEW_LEADS,
    MARKETING_PERMISSIONS.MANAGE_LEADS,
    MARKETING_PERMISSIONS.EXPORT_DATA,
    MARKETING_PERMISSIONS.IMPORT_DATA,
    MARKETING_PERMISSIONS.VIEW_ANALYTICS,
  ],
  marketing_assistant: [
    MARKETING_PERMISSIONS.VIEW_CAMPAIGNS,
    MARKETING_PERMISSIONS.VIEW_LEADS,
    MARKETING_PERMISSIONS.VIEW_ANALYTICS,
  ],
} as const;
