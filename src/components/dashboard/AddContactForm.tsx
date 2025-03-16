
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import ProfileImageSection from './ContactForm/ProfileImageSection';
import BasicInfoSection from './ContactForm/BasicInfoSection';
import EmailsSection from './ContactForm/EmailsSection';
import PhonesSection from './ContactForm/PhonesSection';
import DndPreferenceSection from './ContactForm/DndPreferenceSection';
import FormActions from './ContactForm/FormActions';
import { useContactForm } from './ContactForm/useContactForm';
import { ContactData } from './ContactForm/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContactData) => Promise<void>;
}

const AddContactForm: React.FC<AddContactFormProps> = ({ open, onClose, onSubmit }) => {
  const {
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
  } = useContactForm({ 
    onSubmit: async (data) => {
      try {
        // Check for existing contacts to get a valid user_id
        const { data: existingContacts, error: fetchError } = await supabase
          .from('contacts')
          .select('user_id')
          .limit(1);
        
        if (fetchError) {
          console.error('Error fetching existing contacts:', fetchError);
          toast({
            title: 'Error',
            description: 'Failed to prepare contact data',
            variant: 'destructive'
          });
          throw fetchError;
        }
        
        // Use an existing user_id from the database if available, or generate a demo one
        if (existingContacts && existingContacts.length > 0) {
          data.user_id = existingContacts[0].user_id;
        } else {
          // Generate a random UUID for demo purposes
          data.user_id = crypto.randomUUID();
        }
        
        console.log('Submitting contact with user_id:', data.user_id);
        await onSubmit(data);
      } catch (error) {
        console.error('Error in contact submission:', error);
        toast({
          title: 'Error',
          description: 'Failed to add contact',
          variant: 'destructive'
        });
        throw error;
      }
    }, 
    onClose 
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new contact to your database.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Profile Image Section */}
            <ProfileImageSection />

            {/* Basic Information */}
            <BasicInfoSection form={form} />

            {/* Email Addresses */}
            <EmailsSection 
              emails={emails}
              onEmailChange={handleEmailChange}
              onAddEmail={handleAddEmail}
              onRemoveEmail={removeEmail}
            />

            {/* Phone Numbers */}
            <PhonesSection 
              phones={phones}
              onPhoneChange={handlePhoneChange}
              onAddPhone={handleAddPhone}
              onRemovePhone={removePhone}
            />

            {/* DND Preferences */}
            <DndPreferenceSection form={form} />

            {/* Form Actions */}
            <FormActions isLoading={isLoading} onCancel={onClose} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactForm;
