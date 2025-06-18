
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
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string[];
  last_activity?: string | null;
  updated_at: string;
  id?: string;
  notes?: string | null;
}
