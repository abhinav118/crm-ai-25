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
      campaigns: {
        Row: {
          campaign_name: string
          category: string | null
          created_at: string | null
          discount_price: number | null
          discount_type: string | null
          email_content: string | null
          email_subject: string | null
          id: string
          image_url: string | null
          location_id: string | null
          merchant_id: string | null
          min_item_count: number | null
          number_of_days: number | null
          sms_content: string | null
          status: string | null
          total_redemptions: number | null
          updated_at: string | null
          user_id: string
          valid_till: string | null
        }
        Insert: {
          campaign_name: string
          category?: string | null
          created_at?: string | null
          discount_price?: number | null
          discount_type?: string | null
          email_content?: string | null
          email_subject?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          merchant_id?: string | null
          min_item_count?: number | null
          number_of_days?: number | null
          sms_content?: string | null
          status?: string | null
          total_redemptions?: number | null
          updated_at?: string | null
          user_id: string
          valid_till?: string | null
        }
        Update: {
          campaign_name?: string
          category?: string | null
          created_at?: string | null
          discount_price?: number | null
          discount_type?: string | null
          email_content?: string | null
          email_subject?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          merchant_id?: string | null
          min_item_count?: number | null
          number_of_days?: number | null
          sms_content?: string | null
          status?: string | null
          total_redemptions?: number | null
          updated_at?: string | null
          user_id?: string
          valid_till?: string | null
        }
        Relationships: []
      }
      contact_logs: {
        Row: {
          action: string
          batch_id: string | null
          batch_name: string | null
          contact_info: Json
          created_at: string
          id: string
        }
        Insert: {
          action: string
          batch_id?: string | null
          batch_name?: string | null
          contact_info: Json
          created_at?: string
          id?: string
        }
        Update: {
          action?: string
          batch_id?: string | null
          batch_name?: string | null
          contact_info?: Json
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          last_activity: string | null
          name: string
          phone: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_activity?: string | null
          name: string
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_activity?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel: string
          contact_id: string
          content: string
          id: string
          sender: string
          sent_at: string
        }
        Insert: {
          channel?: string
          contact_id: string
          content: string
          id?: string
          sender: string
          sent_at?: string
        }
        Update: {
          channel?: string
          contact_id?: string
          content?: string
          id?: string
          sender?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_analytics: {
        Row: {
          clicked_by: string[] | null
          clicks: number | null
          conversions: number | null
          ctr: number | null
          id: string
          last_clicked: string | null
          link: string | null
        }
        Insert: {
          clicked_by?: string[] | null
          clicks?: number | null
          conversions?: number | null
          ctr?: number | null
          id?: string
          last_clicked?: string | null
          link?: string | null
        }
        Update: {
          clicked_by?: string[] | null
          clicks?: number | null
          conversions?: number | null
          ctr?: number | null
          id?: string
          last_clicked?: string | null
          link?: string | null
        }
        Relationships: []
      }
      user_chat_history: {
        Row: {
          created_at: string
          id: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_generated_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          prompt: string | null
          size: string | null
          style: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          prompt?: string | null
          size?: string | null
          style?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string | null
          size?: string | null
          style?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      format_phone_e164: {
        Args: { phone: string }
        Returns: string
      }
      format_phone_number: {
        Args: { phone: string }
        Returns: string
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
