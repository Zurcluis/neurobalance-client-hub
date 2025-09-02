export interface MarketingCampaign {
  id: string;
  name: string;
  origem: string;
  mes: number;
  ano: number;
  investimento: number;
  leads: number;
  cpl: number;
  reunioes: number;
  vendas: number;
  receita: number;
  cac: number;
  taxa_conversao: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingMetrics {
  totalInvestimento: number;
  totalLeads: number;
  totalReunioes: number;
  totalVendas: number;
  totalReceita: number;
  cplMedio: number;
  cacMedio: number;
  taxaConversaoMedia: number;
  roi: number;
  roas: number;
}

export interface CampaignFilters {
  origem?: string;
  mesInicio?: number;
  anoInicio?: number;
  mesFim?: number;
  anoFim?: number;
  ordenarPor?: 'nome' | 'mes' | 'investimento' | 'leads' | 'receita' | 'roi';
  ordem?: 'asc' | 'desc';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface MonthlyReport {
  mes: number;
  ano: number;
  campanhas: MarketingCampaign[];
  metricas: MarketingMetrics;
  comparacaoMesAnterior: {
    investimentoVariacao: number;
    leadsVariacao: number;
    receitaVariacao: number;
    roiVariacao: number;
  };
}

export interface ExportOptions {
  formato: 'pdf' | 'csv';
  periodo: {
    mesInicio: number;
    anoInicio: number;
    mesFim: number;
    anoFim: number;
  };
  incluirGraficos?: boolean;
  incluirComparacoes?: boolean;
}

export const ORIGENS_CAMPANHA = [
  'Google Ads',
  'Facebook Ads',
  'Instagram Ads',
  'LinkedIn Ads',
  'TikTok Ads',
  'YouTube Ads',
  'Orgânico Google',
  'Orgânico Facebook',
  'Email Marketing',
  'Referência',
  'Direto',
  'Outros'
] as const;

export type OrigemCampanha = typeof ORIGENS_CAMPANHA[number];

export const MESES = [
  { valor: 1, nome: 'Janeiro' },
  { valor: 2, nome: 'Fevereiro' },
  { valor: 3, nome: 'Março' },
  { valor: 4, nome: 'Abril' },
  { valor: 5, nome: 'Maio' },
  { valor: 6, nome: 'Junho' },
  { valor: 7, nome: 'Julho' },
  { valor: 8, nome: 'Agosto' },
  { valor: 9, nome: 'Setembro' },
  { valor: 10, nome: 'Outubro' },
  { valor: 11, nome: 'Novembro' },
  { valor: 12, nome: 'Dezembro' }
] as const;
