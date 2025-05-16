
export interface ContactFormValues {
  firstName: string;
  lastName: string;
  company: string;
  tags: string[];
  dndPreference: string;
}

export interface PhoneEntry {
  type: string;
  number: string;
}

export interface ContactData {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string[];
  last_activity?: string | null;
  updated_at: string; // Required field
  id?: string; // Optional for updating existing contacts
  notes?: string | null; // Added notes field
}
