
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building, Calendar, Tag, Save } from 'lucide-react';
import { Contact } from './ContactsTable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getFullName } from '@/utils/contactHelpers';

interface ContactProfileProps {
  contact: Contact;
  onSave: (updatedContact: Contact) => void;
}

const ContactProfile: React.FC<ContactProfileProps> = ({ contact, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: contact.first_name,
    last_name: contact.last_name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    company: contact.company || '',
    status: contact.status,
    tags: contact.tags || []
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          status: formData.status,
          tags: formData.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id);

      if (error) throw error;

      const updatedContact: Contact = {
        ...contact,
        ...formData,
        last_name: formData.last_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null
      };

      onSave(updatedContact);
      setIsEditing(false);
      
      toast({
        title: 'Success',
        description: 'Contact updated successfully.',
      });
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      status: contact.status,
      tags: contact.tags || []
    });
    setIsEditing(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{getFullName(contact)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {contact.company || 'No company'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Contact Information</h3>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-gray-600 mt-1">{contact.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-gray-600 mt-1">{contact.last_name || 'N/A'}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">{contact.email || 'N/A'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Phone</span>
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">{contact.phone || 'N/A'}</p>
              )}
            </div>

            <div>
              <Label htmlFor="company" className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Company</span>
              </Label>
              {isEditing ? (
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              ) : (
                <p className="text-sm text-gray-600 mt-1">{contact.company || 'N/A'}</p>
              )}
            </div>

            <div>
              <Label className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Tags</span>
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {contact.tags && contact.tags.length > 0 ? (
                  contact.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tags</p>
                )}
              </div>
            </div>

            <div>
              <Label className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Created</span>
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(contact.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-2">
                <Badge variant={contact.status === 'active' ? 'success' : 'secondary'}>
                  {contact.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactProfile;
