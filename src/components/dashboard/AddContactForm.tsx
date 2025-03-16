
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImagePlus, Plus, Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface ContactFormValues {
  firstName: string;
  lastName: string;
  company: string;
  tags: string[];
  dndPreference: string;
}

const AddContactForm: React.FC<AddContactFormProps> = ({ open, onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [phones, setPhones] = useState([{ type: 'mobile', number: '' }]);
  const [emails, setEmails] = useState(['']);

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
            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                <ImagePlus className="w-8 h-8 text-gray-400" />
              </div>
              <Button type="button" variant="outline" size="sm">
                Upload Image
              </Button>
              <p className="text-xs text-gray-500">
                Recommended: 512x512px (Max 2MB)
              </p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name*</FormLabel>
                    <FormControl>
                      <Input required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name*</FormLabel>
                    <FormControl>
                      <Input required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Addresses */}
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                  />
                  {emails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmail(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEmail}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Email
              </Button>
            </div>

            {/* Phone Numbers */}
            <div className="space-y-2">
              <Label>Phone Numbers</Label>
              {phones.map((phone, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={phone.type}
                    onValueChange={(value) => handlePhoneChange(index, 'type', value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Phone number"
                    value={phone.number}
                    onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                    className="flex-1"
                  />
                  {phones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhone(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPhone}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Another Phone
              </Button>
            </div>

            {/* DND Preferences */}
            <FormField
              control={form.control}
              name="dndPreference"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Communication Preferences (DND)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">Allow All Communications</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="none" />
                        <Label htmlFor="none">Do Not Disturb (All Channels)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom">Custom Settings</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Contact'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactForm;
