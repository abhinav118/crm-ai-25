
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
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string[];
  id?: string; // Optional for updating existing contacts
}
