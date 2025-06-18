
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { ContactFormValues, PhoneEntry, ContactData } from './types';

interface UseContactFormProps {
  onSubmit: (data: ContactData) => Promise<void>;
  onClose: () => void;
  initialData?: Partial<ContactData>;
}

export const useContactForm = ({ onSubmit, onClose, initialData }: UseContactFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [phones, setPhones] = useState<PhoneEntry[]>(
    initialData?.phone ? [{ type: 'mobile', number: initialData.phone }] : [{ type: 'mobile', number: '' }]
  );
  const [emails, setEmails] = useState<string[]>(
    initialData?.email ? [initialData.email] : ['']
  );

  const form = useForm<ContactFormValues>({
    defaultValues: {
      firstName: initialData?.first_name || '',
      lastName: initialData?.last_name || '',
      company: initialData?.company || '',
      tags: initialData?.tags || [],
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
      const submissionData: ContactData = {
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        email: emails[0] && emails[0].trim() !== '' ? emails[0] : null,
        phone: phones[0]?.number && phones[0].number.trim() !== '' ? phones[0].number : null,
        company: values.company || null,
        status: initialData?.status || 'active',
        tags: values.tags || [],
        updated_at: new Date().toISOString()
      };
      
      if (initialData?.id) {
        submissionData.id = initialData.id;
      }
      
      console.log('Preparing contact data for submission:', submissionData);
      
      await onSubmit(submissionData);
      
      form.reset();
      setPhones([{ type: 'mobile', number: '' }]);
      setEmails(['']);
      
      toast({
        title: 'Success',
        description: initialData ? 'Contact updated successfully' : 'Contact added successfully',
      });
      
      onClose();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: initialData ? 'Failed to update contact. Please try again.' : 'Failed to add contact. Please try again.',
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
