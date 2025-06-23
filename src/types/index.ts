
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  status?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  avatar?: string;
  dnd_preference?: boolean;
  profile_image_url?: string;
  emails?: Array<{
    email: string;
    type: string;
  }>;
  phones?: Array<{
    phone: string;
    type: string;
  }>;
}
