
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Edit2, Calendar, Phone, Mail, User, MapPin, Award, AtSign } from 'lucide-react';
import { Contact } from './ContactsTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ContactData } from './ContactForm/types';

interface UserProfileProps {
  contact: Contact;
  onSave?: (contact: Contact) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ contact, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(contact);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Get current user from Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User authentication error:', userError);
      }
      
      // Prepare contact data for upsert
      const contactData: ContactData = {
        user_id: user?.id || formData.id.split('-')[0], // Fallback to using part of the contact ID if no user
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        status: formData.status,
        tags: formData.tags || [],
        id: contact.id // Include ID for update
      };
      
      console.log('Upserting contact data:', contactData);
      
      // Update contact in Supabase - using upsert
      const { data, error } = await supabase
        .from('contacts')
        .upsert({
          id: contact.id,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          company: formData.company || null,
          status: formData.status,
          tags: formData.tags || [],
          updated_at: new Date().toISOString(),
          user_id: contactData.user_id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Contact updated successfully:', data);
      
      // Update UI state
      if (onSave) {
        onSave(formData);
      }
      
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
          disabled={isLoading}
        >
          <Edit2 size={16} className="mr-1" />
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3 flex-1">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email"
              value={formData.email || ''} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              name="phone"
              value={formData.phone || ''} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input 
              id="company" 
              name="company"
              value={formData.company || ''} 
              onChange={handleChange} 
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-1 gap-3">
            <ProfileItem icon={<User />} label="Name" value={contact.name} />
            <ProfileItem icon={<Mail />} label="Email" value={contact.email || 'Not provided'} />
            <ProfileItem icon={<Phone />} label="Phone" value={contact.phone || 'Not provided'} />
            <ProfileItem icon={<Award />} label="Company" value={contact.company || 'Not provided'} />
            <ProfileItem icon={<Calendar />} label="Last Activity" value={formatDate(contact.lastActivity)} />
            <ProfileItem icon={<MapPin />} label="Status" value={contact.status} />
            <ProfileItem icon={<AtSign />} label="Created" value={formatDate(contact.createdAt)} />
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <div className="text-gray-400 mt-1">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

export default UserProfile;
