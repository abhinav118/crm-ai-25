
export interface ContactData {
  id?: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  tags: string[];
  notes?: string | null;
  updated_at: string;
  segment_name?: string;
}

export interface ContactFormProps {
  onSubmit: (data: ContactData) => Promise<void>;
  onClose: () => void;
  initialData?: ContactData;
}
