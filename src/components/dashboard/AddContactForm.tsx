
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logContactAction } from '@/utils/contactLogger';
import { syncContactToSegment } from '@/utils/segmentSync';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatPhoneNumber } from '@/utils/phoneFormatter';

interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  segment_name: string;
}

interface AddContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
}

const AddContactForm: React.FC<AddContactFormProps> = ({ open, onOpenChange, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ContactFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      segment_name: 'UNASSIGNED'
    }
  });

  // Fetch available segments with proper deduplication
  const { data: segments = [] } = useQuery({
    queryKey: ['contact-segments'],
    queryFn: async () => {
      console.log('Fetching available segments...');
      
      const { data, error } = await supabase
        .from('contacts_segments')
        .select('segment_name,contacts_membership')
          .gt('contacts_membership', '[]')
        .order('segment_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching segments:', error);
        return [];
      }

      // Remove duplicates and ensure values are trimmed
      const segmentOptions = Array.from(
        new Set((data ?? []).map(seg => seg.segment_name?.trim()).filter(Boolean))
      );

      console.log('Processed segment options:', segmentOptions);
      return segmentOptions;
    },
  });

  const handleFormSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    
    try {
      // Validate segment_name is from the fetched list or UNASSIGNED
      const validSegments = ['UNASSIGNED', ...segments];
      const selectedSegment = data.segment_name?.trim() || 'UNASSIGNED';
      
      if (!validSegments.includes(selectedSegment)) {
        throw new Error('Invalid segment selection');
      }

      // Prepare contact data
      const contactData = {
        first_name: data.first_name.trim(),
        last_name: data.last_name?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() ? formatPhoneNumber(data.phone.trim()) : null,
        company: data.company?.trim() || null,
        status: 'active' as const,
        segment_name: selectedSegment,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: []
      };

      console.log('Submitting contact with data:', contactData);

      // Create new contact
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select()
        .single();

      if (error) throw error;

      // Sync the new contact to its segment
      try {
        await syncContactToSegment(newContact);
      } catch (syncError) {
        console.error('Failed to sync contact to segment:', syncError);
        // Don't fail the whole operation if segment sync fails
      }

      // Log the contact addition
      await logContactAction('add', newContact);

      toast({
        title: 'Contact created',
        description: 'The new contact has been successfully created.',
      });

      // Invalidate and refetch contacts
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-segments'] });
      
      // Reset form and close dialog
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        segment_name: 'UNASSIGNED'
      });
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to create contact. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new contact to your database.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company */}
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Segment Selector */}
            <FormField
              control={form.control}
              name="segment_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segment</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    defaultValue="UNASSIGNED"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a segment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED"></SelectItem>
                      {segments.map(segment => (
                        <SelectItem key={segment} value={segment}>
                          {segment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
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
