export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      allowed_users: {
        Row: {
          created_at: string
          email: string
          note: string | null
        }
        Insert: {
          created_at?: string
          email: string
          note?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          note?: string | null
        }
        Relationships: []
      }
      export_templates: {
        Row: {
          columns: Json
          created_at: string
          id: string
          name: string
        }
        Insert: {
          columns?: Json
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          columns?: Json
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      form_attachments: {
        Row: {
          created_at: string
          doc_type: string | null
          file_name: string
          form_id: string
          id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          file_name: string
          form_id: string
          id?: string
          storage_path: string
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          file_name?: string
          form_id?: string
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_attachments_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          ack_no: string | null
          amount_fc: number | null
          amount_inr: number | null
          bank_name: string | null
          billing_invoice_no: string | null
          certificate_required: string | null
          certification_charges: number | null
          copied_from: string | null
          created_at: string
          currency: string | null
          document_description: string | null
          dtaa_article: string | null
          exchange_rate: number | null
          filing_date: string | null
          form_type: string
          fy: string | null
          gross_amount: number | null
          id: string
          invoicing_status: string
          is_revised: boolean
          nature_of_remittance: string | null
          net_amount: number | null
          payment_status: string
          portal_details: Json
          proposed_remittance_date: string | null
          purpose_code: string | null
          relevant_section: string | null
          remarks: string | null
          remittee_id: string | null
          remittee_invoice_date: string | null
          remittee_invoice_no: string | null
          remittee_tin: string | null
          remitter_id: string | null
          sr_no: string | null
          start_date: string | null
          status: string
          taxable_in_india: string | null
          tds_amount: number | null
          tds_basis: string | null
          tds_rate: number | null
          udin: string | null
          updated_at: string
        }
        Insert: {
          ack_no?: string | null
          amount_fc?: number | null
          amount_inr?: number | null
          bank_name?: string | null
          billing_invoice_no?: string | null
          certificate_required?: string | null
          certification_charges?: number | null
          copied_from?: string | null
          created_at?: string
          currency?: string | null
          document_description?: string | null
          dtaa_article?: string | null
          exchange_rate?: number | null
          filing_date?: string | null
          form_type?: string
          fy?: string | null
          gross_amount?: number | null
          id?: string
          invoicing_status?: string
          is_revised?: boolean
          nature_of_remittance?: string | null
          net_amount?: number | null
          payment_status?: string
          portal_details?: Json
          proposed_remittance_date?: string | null
          purpose_code?: string | null
          relevant_section?: string | null
          remarks?: string | null
          remittee_id?: string | null
          remittee_invoice_date?: string | null
          remittee_invoice_no?: string | null
          remittee_tin?: string | null
          remitter_id?: string | null
          sr_no?: string | null
          start_date?: string | null
          status?: string
          taxable_in_india?: string | null
          tds_amount?: number | null
          tds_basis?: string | null
          tds_rate?: number | null
          udin?: string | null
          updated_at?: string
        }
        Update: {
          ack_no?: string | null
          amount_fc?: number | null
          amount_inr?: number | null
          bank_name?: string | null
          billing_invoice_no?: string | null
          certificate_required?: string | null
          certification_charges?: number | null
          copied_from?: string | null
          created_at?: string
          currency?: string | null
          document_description?: string | null
          dtaa_article?: string | null
          exchange_rate?: number | null
          filing_date?: string | null
          form_type?: string
          fy?: string | null
          gross_amount?: number | null
          id?: string
          invoicing_status?: string
          is_revised?: boolean
          nature_of_remittance?: string | null
          net_amount?: number | null
          payment_status?: string
          portal_details?: Json
          proposed_remittance_date?: string | null
          purpose_code?: string | null
          relevant_section?: string | null
          remarks?: string | null
          remittee_id?: string | null
          remittee_invoice_date?: string | null
          remittee_invoice_no?: string | null
          remittee_tin?: string | null
          remitter_id?: string | null
          sr_no?: string | null
          start_date?: string | null
          status?: string
          taxable_in_india?: string | null
          tds_amount?: number | null
          tds_basis?: string | null
          tds_rate?: number | null
          udin?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_remittee_id_fkey"
            columns: ["remittee_id"]
            isOneToOne: false
            referencedRelation: "remittees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_remitter_id_fkey"
            columns: ["remitter_id"]
            isOneToOne: false
            referencedRelation: "remitters"
            referencedColumns: ["id"]
          },
        ]
      }
      remittees: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          dtaa_article: string | null
          email: string | null
          form_10f: boolean | null
          id: string
          name: string
          nature_of_remittance: string | null
          nickname: string
          notes: string | null
          pan: string | null
          pe_in_india: boolean | null
          phone: string | null
          principal_place: string | null
          purpose_code: string | null
          tin: string | null
          trc_available: boolean | null
          trc_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          dtaa_article?: string | null
          email?: string | null
          form_10f?: boolean | null
          id?: string
          name: string
          nature_of_remittance?: string | null
          nickname: string
          notes?: string | null
          pan?: string | null
          pe_in_india?: boolean | null
          phone?: string | null
          principal_place?: string | null
          purpose_code?: string | null
          tin?: string | null
          trc_available?: boolean | null
          trc_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          dtaa_article?: string | null
          email?: string | null
          form_10f?: boolean | null
          id?: string
          name?: string
          nature_of_remittance?: string | null
          nickname?: string
          notes?: string | null
          pan?: string | null
          pe_in_india?: boolean | null
          phone?: string | null
          principal_place?: string | null
          purpose_code?: string | null
          tin?: string | null
          trc_available?: boolean | null
          trc_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      remitters: {
        Row: {
          address: string | null
          ao_details: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          bsr_code: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          entity_status: string | null
          id: string
          name: string
          nickname: string
          notes: string | null
          pan: string | null
          phone: string | null
          pincode: string | null
          residential_status: string | null
          state: string | null
          tan: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          ao_details?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          bsr_code?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          entity_status?: string | null
          id?: string
          name: string
          nickname: string
          notes?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          residential_status?: string | null
          state?: string | null
          tan?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          ao_details?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          bsr_code?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          entity_status?: string | null
          id?: string
          name?: string
          nickname?: string
          notes?: string | null
          pan?: string | null
          phone?: string | null
          pincode?: string | null
          residential_status?: string | null
          state?: string | null
          tan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_allowed_user: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
