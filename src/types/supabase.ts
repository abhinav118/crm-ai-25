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
      // ... other tables ...
    };
  };
}; 