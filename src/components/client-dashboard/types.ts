export interface ClientRecord {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  morada: string | null;
  data_nascimento: string | null;
  genero: string | null;
  notas: string | null;
  estado: string;
  id_manual: string | null;
  numero_sessoes: number | null;
  max_sessoes: number | null;
  total_pago: number | null;
  criado_em: string | null;
  proxima_sessao: string | null;
  proxima_sessao_titulo: string | null;
  proxima_sessao_tipo: string | null;
  proxima_sessao_estado: string | null;
  proxima_sessao_hora: string | null;
  proxima_sessao_terapeuta: string | null;
}
