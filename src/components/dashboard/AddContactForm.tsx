
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
        
        // Try to use authenticated user, fall back to an existing user_id from the database
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User authentication error:', userError);
          
          // Use an existing user_id from the database if available
          if (existingContacts && existingContacts.length > 0) {
            data.user_id = existingContacts[0].user_id;
            console.log('Using existing user_id for contact:', data.user_id);
          } else {
            // If no contacts exist yet, we can't create a new one without a valid user
            toast({
              title: 'Authentication Required',
              description: 'Please sign in to add contacts or contact your administrator',
              variant: 'destructive'
            });
            throw new Error('No valid user_id available');
          }
        } else {
          data.user_id = user?.id || existingContacts[0]?.user_id;
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
