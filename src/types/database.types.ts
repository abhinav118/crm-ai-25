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
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          status: 'active' | 'inactive'
          tags?: string[] | null
          created_at: string
          updated_at: string
          segment_name?: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          status?: 'active' | 'inactive'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          segment_name?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          status?: 'active' | 'inactive'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
          segment_name?: string | null
        }
      }
      contacts_segments: {
        Row: {
          segment_name: string
          contacts_membership: Json
          updated_at: string
        }
        Insert: {
          segment_name: string
          contacts_membership?: Json
          updated_at?: string
        }
        Update: {
          segment_name?: string
          contacts_membership?: Json
          updated_at?: string
        }
      }
      // Add other tables as needed...
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
  }
} 