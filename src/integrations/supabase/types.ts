export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          criado_em: string | null
          data: string | null
          estado: string | null
          hora: string | null
          id: string
          id_cliente: string | null
          notas: string | null
          tipo: string | null
          titulo: string | null
        }
        Insert: {
          criado_em?: string | null
          data?: string | null
          estado?: string | null
          hora?: string | null
          id?: string
          id_cliente?: string | null
          notas?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Update: {
          criado_em?: string | null
          data?: string | null
          estado?: string | null
          hora?: string | null
          id?: string
          id_cliente?: string | null
          notas?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          como_conheceu: string | null
          criado_em: string | null
          data_nascimento: string | null
          email: string | null
          estado: string | null
          genero: string | null
          id: string
          morada: string | null
          nome: string
          notas: string | null
          telefone: string | null
          tipo_contato: string | null
        }
        Insert: {
          como_conheceu?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          genero?: string | null
          id?: string
          morada?: string | null
          nome: string
          notas?: string | null
          telefone?: string | null
          tipo_contato?: string | null
        }
        Update: {
          como_conheceu?: string | null
          criado_em?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          genero?: string | null
          id?: string
          morada?: string | null
          nome?: string
          notas?: string | null
          telefone?: string | null
          tipo_contato?: string | null
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          criado_em: string | null
          data: string
          descricao: string | null
          id: string
          id_cliente: string | null
          metodo: string | null
          valor: number
        }
        Insert: {
          criado_em?: string | null
          data: string
          descricao?: string | null
          id?: string
          id_cliente?: string | null
          metodo?: string | null
          valor: number
        }
        Update: {
          criado_em?: string | null
          data?: string
          descricao?: string | null
          id?: string
          id_cliente?: string | null
          metodo?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes: {
        Row: {
          criada_em: string | null
          data: string
          hora: string | null
          id: string
          id_cliente: string | null
          notas: string | null
          tipo: string | null
        }
        Insert: {
          criada_em?: string | null
          data: string
          hora?: string | null
          id?: string
          id_cliente?: string | null
          notas?: string | null
          tipo?: string | null
        }
        Update: {
          criada_em?: string | null
          data?: string
          hora?: string | null
          id?: string
          id_cliente?: string | null
          notas?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
