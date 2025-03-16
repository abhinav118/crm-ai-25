
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ContactFormValues, PhoneEntry, ContactData } from './types';

interface UseContactFormProps {
  onSubmit: (data: ContactData) => Promise<void>;
  onClose: () => void;
}

export const useContactForm = ({ onSubmit, onClose }: UseContactFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [phones, setPhones] = useState<PhoneEntry[]>([{ type: 'mobile', number: '' }]);
  const [emails, setEmails] = useState<string[]>(['']);

  const form = useForm<ContactFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      tags: [],
      dndPreference: 'all'
    }
  });

  const handleAddPhone = () => {
    setPhones([...phones, { type: 'mobile', number: '' }]);
  };

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handlePhoneChange = (index: number, field: 'type' | 'number', value: string) => {
    const newPhones = [...phones];
    if (field === 'type') {
      newPhones[index].type = value;
    } else {
      newPhones[index].number = value;
    }
    setPhones(newPhones);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const removePhone = (index: number) => {
    if (phones.length > 1) {
      const newPhones = phones.filter((_, i) => i !== index);
      setPhones(newPhones);
    }
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const handleFormSubmit = async (values: ContactFormValues) => {
    setIsLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use a placeholder user ID for development
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      // Prepare submission data
      const submissionData = {
        user_id: userId,
        name: `${values.firstName} ${values.lastName}`.trim(),
        email: emails[0] || null, // Use the first email as the primary
        phone: phones[0]?.number || null, // Use the first phone as the primary
        company: values.company || null,
        status: 'active',
        tags: values.tags || []
      };
      
      // Submit data to parent component
      await onSubmit(submissionData);
      
      // Reset form
      form.reset();
      setPhones([{ type: 'mobile', number: '' }]);
      setEmails(['']);
      
      // Display success message
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      });
      
      // Close the form
      onClose();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    phones,
    emails,
    handleAddPhone,
    handleAddEmail,
    handlePhoneChange,
    handleEmailChange,
    removePhone,
    removeEmail,
    handleFormSubmit
  };
};
