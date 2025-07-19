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
      ai_image_chat_users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          user_type?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          user_type?: string
        }
        Relationships: []
      }
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
      chat_logs: {
        Row: {
          goals_reference: string[] | null
          id: string
          message: string
          response: string
          session_id: string | null
          timestamp: string
          voice_response_duration: number | null
          voice_response_used: boolean | null
        }
        Insert: {
          goals_reference?: string[] | null
          id?: string
          message: string
          response: string
          session_id?: string | null
          timestamp?: string
          voice_response_duration?: number | null
          voice_response_used?: boolean | null
        }
        Update: {
          goals_reference?: string[] | null
          id?: string
          message?: string
          response?: string
          session_id?: string | null
          timestamp?: string
          voice_response_duration?: number | null
          voice_response_used?: boolean | null
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
      contacts_old: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          last_activity: string | null
          name: string
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
          phone?: string | null
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
      favorite_recipes: {
        Row: {
          calories: number | null
          created_at: string
          id: string
          image_url: string | null
          macros: Json | null
          recipe_id: string
          recipe_ingredients: string | null
          recipe_instructions: string | null
          recipe_title: string
          session_id: string
          slug: string | null
          source: string | null
        }
        Insert: {
          calories?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          macros?: Json | null
          recipe_id: string
          recipe_ingredients?: string | null
          recipe_instructions?: string | null
          recipe_title: string
          session_id: string
          slug?: string | null
          source?: string | null
        }
        Update: {
          calories?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          macros?: Json | null
          recipe_id?: string
          recipe_ingredients?: string | null
          recipe_instructions?: string | null
          recipe_title?: string
          session_id?: string
          slug?: string | null
          source?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          image_id: string | null
          image_url: string
          prompt: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_id?: string | null
          image_url: string
          prompt?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_id?: string | null
          image_url?: string
          prompt?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      fi_ai_chat_logs: {
        Row: {
          ai_chat_response: string
          created_at: string | null
          has_graph: boolean | null
          id: string
          session_id: string
          stock_symbol: string | null
          tier: string | null
          user_chat: string
        }
        Insert: {
          ai_chat_response: string
          created_at?: string | null
          has_graph?: boolean | null
          id?: string
          session_id: string
          stock_symbol?: string | null
          tier?: string | null
          user_chat: string
        }
        Update: {
          ai_chat_response?: string
          created_at?: string | null
          has_graph?: boolean | null
          id?: string
          session_id?: string
          stock_symbol?: string | null
          tier?: string | null
          user_chat?: string
        }
        Relationships: []
      }
      fridge_inventory: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          ingredient_name: string
          quantity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_name: string
          quantity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          ingredient_name?: string
          quantity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grocery_items: {
        Row: {
          category: string
          created_at: string
          id: string
          ingredient_name: string
          meal_plan_id: string | null
          meal_title: string | null
          owned: boolean
          quantity: string | null
          recipe_id: string | null
          session_id: string | null
          source: string
          source_id: string | null
          source_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          ingredient_name: string
          meal_plan_id?: string | null
          meal_title?: string | null
          owned?: boolean
          quantity?: string | null
          recipe_id?: string | null
          session_id?: string | null
          source?: string
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          ingredient_name?: string
          meal_plan_id?: string | null
          meal_title?: string | null
          owned?: boolean
          quantity?: string | null
          recipe_id?: string | null
          session_id?: string | null
          source?: string
          source_id?: string | null
          source_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      outfit_analyses: {
        Row: {
          cohesion_score: number
          colors: Json
          created_at: string
          id: string
          image_url: string
          items: Json
          original_filename: string | null
          season: string
          style: string
          suggestions: Json
          user_id: string | null
        }
        Insert: {
          cohesion_score: number
          colors: Json
          created_at?: string
          id?: string
          image_url: string
          items: Json
          original_filename?: string | null
          season: string
          style: string
          suggestions: Json
          user_id?: string | null
        }
        Update: {
          cohesion_score?: number
          colors?: Json
          created_at?: string
          id?: string
          image_url?: string
          items?: Json
          original_filename?: string | null
          season?: string
          style?: string
          suggestions?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      privacy_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          messages: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      privacy_users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          google_user_id: string | null
          id: string
          last_scan_date: string | null
          name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          google_user_id?: string | null
          id?: string
          last_scan_date?: string | null
          name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          google_user_id?: string | null
          id?: string
          last_scan_date?: string | null
          name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number | null
          cost_per_serving: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          image_url: string | null
          ingredients: string | null
          instructions: string | null
          macros: Json | null
          slug: string
          time_minutes: number | null
          title: string
        }
        Insert: {
          calories?: number | null
          cost_per_serving?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          instructions?: string | null
          macros?: Json | null
          slug: string
          time_minutes?: number | null
          title: string
        }
        Update: {
          calories?: number | null
          cost_per_serving?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          instructions?: string | null
          macros?: Json | null
          slug?: string
          time_minutes?: number | null
          title?: string
        }
        Relationships: []
      }
      recommend_recipes: {
        Row: {
          calories: number | null
          carbs: string | null
          cost: string | null
          created_at: string
          difficulty: string | null
          fat: string | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: Json | null
          protein: string | null
          session_id: string
          slug: string
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          calories?: number | null
          carbs?: string | null
          cost?: string | null
          created_at?: string
          difficulty?: string | null
          fat?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          protein?: string | null
          session_id: string
          slug: string
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          calories?: number | null
          carbs?: string | null
          cost?: string | null
          created_at?: string
          difficulty?: string | null
          fat?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          protein?: string | null
          session_id?: string
          slug?: string
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          customer_name: string
          email: string
          id: string
          party_size: number
          phone: string | null
          reservation_date: string
          reservation_time: string
          special_requests: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          email: string
          id?: string
          party_size: number
          phone?: string | null
          reservation_date: string
          reservation_time: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          email?: string
          id?: string
          party_size?: number
          phone?: string | null
          reservation_date?: string
          reservation_time?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_sessions: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          title: string
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_summaries: {
        Row: {
          created_at: string | null
          high_permission_apps: number | null
          id: string
          inactive_apps: number | null
          risky_apps: number | null
          scan_date: string | null
          total_apps: number | null
          unknown_publisher_apps: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          high_permission_apps?: number | null
          id?: string
          inactive_apps?: number | null
          risky_apps?: number | null
          scan_date?: string | null
          total_apps?: number | null
          unknown_publisher_apps?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          high_permission_apps?: number | null
          id?: string
          inactive_apps?: number | null
          risky_apps?: number | null
          scan_date?: string | null
          total_apps?: number | null
          unknown_publisher_apps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      scanned_apps: {
        Row: {
          app_id: string
          app_name: string
          category: Database["public"]["Enums"]["app_category"] | null
          created_at: string | null
          id: string
          last_used: string | null
          permissions: Json | null
          publisher: string | null
          risk_level: Database["public"]["Enums"]["app_risk_level"] | null
          risk_reasons: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_id: string
          app_name: string
          category?: Database["public"]["Enums"]["app_category"] | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          permissions?: Json | null
          publisher?: string | null
          risk_level?: Database["public"]["Enums"]["app_risk_level"] | null
          risk_reasons?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_id?: string
          app_name?: string
          category?: Database["public"]["Enums"]["app_category"] | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          permissions?: Json | null
          publisher?: string | null
          risk_level?: Database["public"]["Enums"]["app_risk_level"] | null
          risk_reasons?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          payload: Json
          scheduled_at: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload: Json
          scheduled_at: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          payload?: Json
          scheduled_at?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
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
      trending_recipes: {
        Row: {
          calories: number | null
          created_at: string
          difficulty: string | null
          id: string
          image_url: string | null
          ingredients: string | null
          instructions: string | null
          macros: Json | null
          region: string
          slug: string
          source_url: string | null
          time_minutes: number | null
          title: string
          trend_type: string
          updated_at: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          instructions?: string | null
          macros?: Json | null
          region?: string
          slug: string
          source_url?: string | null
          time_minutes?: number | null
          title: string
          trend_type: string
          updated_at?: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          instructions?: string | null
          macros?: Json | null
          region?: string
          slug?: string
          source_url?: string | null
          time_minutes?: number | null
          title?: string
          trend_type?: string
          updated_at?: string
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
          created_at: string | null
          experience_level: string | null
          goals: string[] | null
          id: string
          onboarding_completed: boolean | null
          preferences: Json
          preferred_communication_style: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_level?: string | null
          goals?: string[] | null
          id?: string
          onboarding_completed?: boolean | null
          preferences?: Json
          preferred_communication_style?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          experience_level?: string | null
          goals?: string[] | null
          id?: string
          onboarding_completed?: boolean | null
          preferences?: Json
          preferred_communication_style?: string | null
          updated_at?: string | null
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
