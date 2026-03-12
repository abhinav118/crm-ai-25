// Re-export types from the main Supabase integration
export * from "@/integrations/supabase/types";

// Legacy exports for backward compatibility
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          first_name: string;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status: "active" | "inactive";
          tags?: string[] | null;
          created_at: string;
          updated_at: string;
          segment_name?: string | null;
          notes?: string | null;
          last_activity?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: "active" | "inactive";
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
          segment_name?: string | null;
          notes?: string | null;
          last_activity?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          status?: "active" | "inactive";
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
          segment_name?: string | null;
          notes?: string | null;
          last_activity?: string | null;
        };
      };
      contacts_segments: {
        Row: {
          segment_name: string;
          contacts_membership: Json;
          updated_at: string;
        };
        Insert: {
          segment_name: string;
          contacts_membership?: Json;
          updated_at?: string;
        };
        Update: {
          segment_name?: string;
          contacts_membership?: Json;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          contact_id: string;
          content: string;
          sender: string;
          sent_at: string;
          channel: string | null;
          direction: string | null;
          is_read: boolean | null;
          media_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          content: string;
          sender: string;
          sent_at?: string;
          channel?: string | null;
          direction?: string | null;
          is_read?: boolean | null;
          media_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          content?: string;
          sender?: string;
          sent_at?: string;
          channel?: string | null;
          direction?: string | null;
          is_read?: boolean | null;
          media_url?: string | null;
          created_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          type: string | null;
          status: string | null;
          message_content: string | null;
          recipients: Json | null;
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string | null;
          status?: string | null;
          message_content?: string | null;
          recipients?: Json | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string | null;
          status?: string | null;
          message_content?: string | null;
          recipients?: Json | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_logs: {
        Row: {
          id: string;
          action: string;
          contact_info: Json | null;
          batch_id: string | null;
          batch_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          contact_info?: Json | null;
          batch_id?: string | null;
          batch_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          contact_info?: Json | null;
          batch_id?: string | null;
          batch_name?: string | null;
          created_at?: string;
        };
      };
      sms_analytics: {
        Row: {
          id: string;
          contact_id: string | null;
          campaign_id: string | null;
          clicks: number | null;
          last_clicked: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contact_id?: string | null;
          campaign_id?: string | null;
          clicks?: number | null;
          last_clicked?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string | null;
          campaign_id?: string | null;
          clicks?: number | null;
          last_clicked?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      telnyx_campaigns: {
        Row: {
          id: string;
          name: string;
          status: string | null;
          message_content: string | null;
          recipients: Json | null;
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: string | null;
          message_content?: string | null;
          recipients?: Json | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: string | null;
          message_content?: string | null;
          recipients?: Json | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
