export interface MarketingAccessToken {
    id: string;
    token: string;
    email: string;
    name: string;
    role: 'marketing_manager' | 'marketing_assistant';
    validityPeriod: '24h' | '7d' | '1m' | '1y' | '2y' | '6y' | '12y' | 'lifetime';
    createdAt: string;
    expiresAt: string;
    createdBy: string;
    isActive: boolean;
    usageCount: number;
    lastUsedAt?: string;
}

export const VALIDITY_PERIODS = {
    '24h': { label: '24 Horas', hours: 24 },
    '7d': { label: '7 Dias', hours: 24 * 7 },
    '1m': { label: '1 Mês', hours: 24 * 30 },
    '1y': { label: '1 Ano', hours: 24 * 365 },
    '2y': { label: '2 Anos', hours: 24 * 365 * 2 },
    '6y': { label: '6 Anos', hours: 24 * 365 * 6 },
    '12y': { label: '12 Anos', hours: 24 * 365 * 12 },
    'lifetime': { label: 'Acesso Vitalício', hours: 24 * 365 * 100 }
} as const;

export const generateAccessToken = (): string => {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timestampPart = Date.now().toString(36);
    return `MKT_${randomPart}${timestampPart}`.toUpperCase();
};

export const calculateExpirationDate = (validityPeriod: keyof typeof VALIDITY_PERIODS): string => {
    const hours = VALIDITY_PERIODS[validityPeriod].hours;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    return expiresAt.toISOString();
};
