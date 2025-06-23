
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contact } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EditContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onContactUpdate: (updatedContact: Contact) => void;
}

const EditContactDialog: React.FC<EditContactDialogProps> = ({
  isOpen,
  onClose,
  contact,
  onContactUpdate
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    company: '',
    status: 'active' as 'active' | 'inactive' | 'busy' | 'away'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        company: contact.company || '',
        status: (contact.status as 'active' | 'inactive' | 'busy' | 'away') || 'active'
      });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(formData)
        .eq('id', contact.id)
        .select()
        .single();

      if (error) throw error;

      const updatedContact: Contact = {
        ...contact,
        ...data,
        status: data.status as 'active' | 'inactive' | 'busy' | 'away',
        createdAt: contact.createdAt,
        updatedAt: new Date().toISOString()
      };

      onContactUpdate(updatedContact);
      toast({
        title: "Success",
        description: "Contact updated successfully"
      });
      onClose();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContactDialog;
