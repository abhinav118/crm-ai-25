
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

interface AddContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
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
  } = useContactForm({ onSubmit, onClose });

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
