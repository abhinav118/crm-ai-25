
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  status?: 'active' | 'inactive' | 'busy' | 'away';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  avatar?: string;
  dnd_preference?: boolean;
  profile_image_url?: string;
  company?: string;
  last_activity?: string;
  segments?: string[];
  emails?: Array<{
    email: string;
    type: string;
  }>;
  phones?: Array<{
    phone: string;
    type: string;
  }>;
  created_at?: string;
  updated_at?: string;
  segment_name?: string;
  notes?: string;
}
