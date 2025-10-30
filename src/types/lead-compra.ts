export interface LeadCompra {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  idade: number;
  genero: 'Masculino' | 'Feminino' | 'Outro';
  cidade: string;
  valor_pago: number;
  data_evento: string;
  tipo: 'Compra' | 'Lead';
  status: 'Iniciou Neurofeedback' | 'Não vai avançar' | 'Vão marcar consulta mais à frente' | 'Vai iniciar NFB mas ainda não marcou primeira consulta' | 'Continuam Neurofeedback' | 'Falta resultados da avaliação' | 'Marcaram avaliação' | 'Começa mais tarde';
  origem_campanha?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadCompraStatistics {
  totalRegistos: number;
  comprasRegistadas: number;
  leadsRegistados: number;
  valorTotalRegistado: number;
  estatisticasValores: {
    registosComValor: number;
    media: number;
    minimo: number;
    mediana: number;
    maximo: number;
  };
  distribuicaoPorGenero: {
    masculino: number;
    feminino: number;
    outro: number;
  };
  distribuicaoPorCidade: { [cidade: string]: number };
  distribuicaoPorMes: { [mes: string]: number };
  conversaoLeadParaCompra: number;
}

export interface LeadCompraFilters {
  tipo?: 'Compra' | 'Lead' | 'Todos';
  genero?: 'Masculino' | 'Feminino' | 'Outro';
  cidade?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  dataInicio?: string;
  dataFim?: string;
  origemCampanha?: string;
  ordenarPor?: 'nome' | 'data_evento' | 'valor_pago' | 'idade';
  ordem?: 'asc' | 'desc';
}

export interface ImportData {
  nome: string;
  email: string;
  telefone: string;
  idade: number;
  genero: string;
  cidade: string;
  valor_pago: number;
  data_evento: string;
  tipo: string;
  origem_campanha?: string;
}

export interface ImportResult {
  totalLinhas: number;
  sucessos: number;
  erros: number;
  detalhesErros: string[];
  dadosImportados: LeadCompra[];
}

export const GENEROS = ['Masculino', 'Feminino', 'Outro'] as const;
export const TIPOS = ['Compra', 'Lead'] as const;

export const STATUS_OPTIONS = [
  'Iniciou Neurofeedback',
  'Não vai avançar', 
  'Vão marcar consulta mais à frente',
  'Vai iniciar NFB mas ainda não marcou primeira consulta',
  'Continuam Neurofeedback',
  'Falta resultados da avaliação',
  'Marcaram avaliação',
  'Começa mais tarde'
] as const;

export const CIDADES_PORTUGAL = [
  'Lisboa',
  'Porto',
  'Vila Nova de Gaia',
  'Amadora',
  'Braga',
  'Funchal',
  'Coimbra',
  'Setúbal',
  'Almada',
  'Agualva-Cacém',
  'Queluz',
  'Rio Tinto',
  'Barreiro',
  'Montijo',
  'Reboleira',
  'Cacém',
  'Vila Franca de Xira',
  'Amora',
  'Corroios',
  'Esposende',
  'Viana do Castelo',
  'Faro',
  'Leiria',
  'Aveiro',
  'Évora',
  'Beja',
  'Castelo Branco',
  'Viseu',
  'Guarda',
  'Santarém',
  'Portalegre',
  'Vila Real',
  'Bragança',
  'Outro'
] as const;

export type Genero = typeof GENEROS[number];
export type Tipo = typeof TIPOS[number];
export type CidadePortugal = typeof CIDADES_PORTUGAL[number];
