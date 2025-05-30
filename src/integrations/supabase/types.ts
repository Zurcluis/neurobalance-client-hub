export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          id: number
          titulo: string
          data: string
          hora: string
          tipo: string
          estado: string
          id_cliente: number
          notas: string
          criado_em: string
          updated_at: string
          terapeuta: string | null
        }
        Insert: {
          id?: number
          titulo: string
          data: string
          hora: string
          tipo?: string
          estado: string
          id_cliente: number
          notas?: string
          criado_em?: string
          updated_at?: string
          terapeuta?: string | null
        }
        Update: {
          id?: number
          titulo?: string
          data?: string
          hora?: string
          tipo?: string
          estado?: string
          id_cliente?: number
          notas?: string
          criado_em?: string
          updated_at?: string
          terapeuta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_id_cliente_fkey"
            columns: ["id_cliente"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      clientes: {
        Row: {
          id: number
          nome: string
          email: string
          telefone: string
          data_nascimento: string
          genero: string
          morada: string
          notas: string
          estado: string
          tipo_contato: string
          como_conheceu: string
          numero_sessoes: number
          total_pago: number
          max_sessoes: number
          proxima_sessao: string
          criado_em: string
          updated_at: string
          responsavel: string | null
          motivo: string | null
          id_manual: string | null
        }
        Insert: {
          id?: number
          nome: string
          email?: string
          telefone: string
          data_nascimento: string
          genero: string
          morada: string
          notas?: string
          estado: string
          tipo_contato: string
          como_conheceu: string
          numero_sessoes?: number
          total_pago?: number
          max_sessoes?: number
          proxima_sessao?: string
          criado_em?: string
          updated_at?: string
          responsavel?: string | null
          motivo?: string | null
          id_manual?: string | null
        }
        Update: {
          id?: number
          nome?: string
          email?: string
          telefone?: string
          data_nascimento?: string
          genero?: string
          morada?: string
          notas?: string
          estado?: string
          tipo_contato?: string
          como_conheceu?: string
          numero_sessoes?: number
          total_pago?: number
          max_sessoes?: number
          proxima_sessao?: string
          criado_em?: string
          updated_at?: string
          responsavel?: string | null
          motivo?: string | null
          id_manual?: string | null
        }
        Relationships: []
      }
      comunicacoes: {
        Row: {
          id: number
          tipo: string
          conteudo: string
          id_cliente: number
          data: string
          status: string
          criado_em: string
          updated_at: string
        }
        Insert: {
          id?: number
          tipo: string
          conteudo: string
          id_cliente: number
          data: string
          status: string
          criado_em?: string
          updated_at?: string
        }
        Update: {
          id?: number
          tipo?: string
          conteudo?: string
          id_cliente?: number
          data?: string
          status?: string
          criado_em?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicacoes_id_cliente_fkey"
            columns: ["id_cliente"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      despesas: {
        Row: {
          id: number
          tipo: string
          categoria: string
          data: string
          valor: number
          notas: string
          criado_em: string
        }
        Insert: {
          id?: number
          tipo: string
          categoria: string
          data: string
          valor: number
          notas?: string
          criado_em?: string
        }
        Update: {
          id?: number
          tipo?: string
          categoria?: string
          data?: string
          valor?: number
          notas?: string
          criado_em?: string
        }
        Relationships: []
      }
      humor_cliente: {
        Row: {
          id: number
          id_cliente: number
          humor: string
          qualidade_sono: string
          notas: string
          data: string
          criado_em: string
          updated_at: string
        }
        Insert: {
          id?: number
          id_cliente: number
          humor: string
          qualidade_sono?: string
          notas?: string
          data: string
          criado_em?: string
          updated_at?: string
        }
        Update: {
          id?: number
          id_cliente?: number
          humor?: string
          qualidade_sono?: string
          notas?: string
          data?: string
          criado_em?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "humor_cliente_id_cliente_fkey"
            columns: ["id_cliente"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      pagamentos: {
        Row: {
          id: number
          id_cliente: number
          valor: number
          data: string
          tipo: string
          descricao: string
          criado_em: string
          updated_at: string
        }
        Insert: {
          id?: number
          id_cliente: number
          valor: number
          data: string
          tipo: string
          descricao?: string
          criado_em?: string
          updated_at?: string
        }
        Update: {
          id?: number
          id_cliente?: number
          valor?: number
          data?: string
          tipo?: string
          descricao?: string
          criado_em?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_id_cliente_fkey"
            columns: ["id_cliente"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      sessoes_ativas: {
        Row: {
          id: number
          id_cliente: number
          inicio: string
          fim: string
          duracao: number
          notas: string
          status: string
          criado_em: string
          updated_at: string
        }
        Insert: {
          id?: number
          id_cliente: number
          inicio: string
          fim?: string
          duracao?: number
          notas?: string
          status?: string
          criado_em?: string
          updated_at?: string
        }
        Update: {
          id?: number
          id_cliente?: number
          inicio?: string
          fim?: string
          duracao?: number
          notas?: string
          status?: string
          criado_em?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_ativas_id_cliente_fkey"
            columns: ["id_cliente"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_despesas_table: {
        Args: Record<string, never>;
        Returns: string;
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
