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
      appointment_confirmations: {
        Row: {
          id: number
          id_agendamento: number
          id_cliente: number
          status: string
          confirmed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          id_agendamento: number
          id_cliente: number
          status?: string
          confirmed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          id_agendamento?: number
          id_cliente?: number
          status?: string
          confirmed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_confirmations_id_agendamento_fkey"
            columns: ["id_agendamento"]
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_confirmations_id_cliente_fkey"
            columns: ["id_cliente"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      client_access_tokens: {
        Row: {
          id: number
          id_cliente: number
          token: string
          expires_at: string
          is_active: boolean
          created_at: string
          last_used_at: string | null
          user_agent: string | null
          ip_address: string | null
        }
        Insert: {
          id?: number
          id_cliente: number
          token: string
          expires_at: string
          is_active?: boolean
          created_at?: string
          last_used_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: number
          id_cliente?: number
          token?: string
          expires_at?: string
          is_active?: boolean
          created_at?: string
          last_used_at?: string | null
          user_agent?: string | null
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_access_tokens_id_cliente_fkey"
            columns: ["id_cliente"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      client_messages: {
        Row: {
          id: number
          id_cliente: number
          sender_type: string
          message: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          id_cliente: number
          sender_type: string
          message: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          id_cliente?: number
          sender_type?: string
          message?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_id_cliente_fkey"
            columns: ["id_cliente"]
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          }
        ]
      }
      client_notifications: {
        Row: {
          id: number
          id_cliente: number
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: number
          id_cliente: number
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: number
          id_cliente?: number
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notifications_id_cliente_fkey"
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
          email: string | null
          telefone: string | null
          data_nascimento: string | null
          genero: string | null
          morada: string | null
          notas: string | null
          estado: string | null
          tipo_contato: string | null
          como_conheceu: string | null
          numero_sessoes: number | null
          total_pago: number | null
          max_sessoes: number | null
          proxima_sessao: string | null
          criado_em: string
          updated_at: string
          responsavel: string | null
          motivo: string | null
          id_manual: string
          data_entrada_clinica: string | null
        }
        Insert: {
          id?: number
          nome: string
          email?: string
          telefone?: string
          data_nascimento?: string | null
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
          id_manual: string
          data_entrada_clinica?: string | null
        }
        Update: {
          id?: number
          nome?: string
          email?: string | null
          telefone?: string | null
          data_nascimento?: string | null
          genero?: string | null
          morada?: string | null
          notas?: string | null
          estado?: string | null
          tipo_contato?: string | null
          como_conheceu?: string | null
          numero_sessoes?: number | null
          total_pago?: number | null
          max_sessoes?: number | null
          proxima_sessao?: string | null
          criado_em?: string
          updated_at?: string
          responsavel?: string | null
          motivo?: string | null
          id_manual?: string
          data_entrada_clinica?: string | null
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
      landing_leads: {
        Row: {
          id: string
          nome: string
          email: string
          telefone: string
          status: string
          origem: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          telefone: string
          status?: string
          origem?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          telefone?: string
          status?: string
          origem?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
