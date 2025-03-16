
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
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User authentication error:', userError);
          // If no authenticated user, generate a guest user ID
          const guestUserId = crypto.randomUUID();
          data.user_id = guestUserId;
        } else {
          data.user_id = user?.id || crypto.randomUUID();
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
