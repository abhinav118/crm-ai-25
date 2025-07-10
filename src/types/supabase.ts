// This file is now deprecated - all types are in src/integrations/supabase/types.ts
// Keeping for backward compatibility but will be removed in future versions

export type ContactSegment = {
  segment_name: string;
  contacts_membership: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    status: 'active' | 'inactive';
    tags: string[] | null;
    created_at: string;
    updated_at: string;
  }>;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      contacts_segments: {
        Row: ContactSegment;
        Insert: Omit<ContactSegment, 'updated_at'>;
        Update: Partial<ContactSegment>;
      };
    };
  };
};
