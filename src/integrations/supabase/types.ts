export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
          first_name: string
          id: string
          last_activity: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          segment_name: string
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_activity?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          segment_name?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_activity?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          segment_name?: string
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts_segments: {
        Row: {
          contacts_membership: Json
          segment_name: string
          updated_at: string | null
        }
        Insert: {
          contacts_membership?: Json
          segment_name: string
          updated_at?: string | null
        }
        Update: {
          contacts_membership?: Json
          segment_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          contact_id: string
          created_at: string
          id: string
          last_message_at: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          contact_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: string
          contact_id: string
          content: string
          direction: string | null
          id: string
          is_read: boolean | null
          media_url: string | null
          sender: string
          sent_at: string
        }
        Insert: {
          channel?: string
          contact_id: string
          content: string
          direction?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          sender: string
          sent_at?: string
        }
        Update: {
          channel?: string
          contact_id?: string
          content?: string
          direction?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
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
      telnyx_campaigns: {
        Row: {
          campaign_name: string
          created_at: string | null
          error_count: number | null
          errors: Json | null
          id: string
          media_url: string | null
          message: string
          progress_percentage: number | null
          recipients: string[]
          repeat_days: string[] | null
          repeat_frequency: string | null
          schedule_time: string | null
          schedule_type: string
          segment_name: string | null
          sent_count: number | null
          status: string | null
          total_count: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_name: string
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          media_url?: string | null
          message: string
          progress_percentage?: number | null
          recipients: string[]
          repeat_days?: string[] | null
          repeat_frequency?: string | null
          schedule_time?: string | null
          schedule_type: string
          segment_name?: string | null
          sent_count?: number | null
          status?: string | null
          total_count?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_name?: string
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          media_url?: string | null
          message?: string
          progress_percentage?: number | null
          recipients?: string[]
          repeat_days?: string[] | null
          repeat_frequency?: string | null
          schedule_time?: string | null
          schedule_type?: string
          segment_name?: string | null
          sent_count?: number | null
          status?: string | null
          total_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_logins: {
        Row: {
          created_at: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          login_email: string
          login_password: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          login_email: string
          login_password: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          login_email?: string
          login_password?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          mobile_number: string | null
          time_zone: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          mobile_number?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile_number?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_logins"
            referencedColumns: ["id"]
          },
        ]
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
      update_contacts_segments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_category:
        | "inactive"
        | "high_permission"
        | "unknown_publisher"
        | "trusted"
      app_risk_level: "low" | "medium" | "high" | "critical"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_category: [
        "inactive",
        "high_permission",
        "unknown_publisher",
        "trusted",
      ],
      app_risk_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
