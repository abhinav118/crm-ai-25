
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Edit2, Calendar, Phone, Mail, User, MapPin, Award, AtSign, Tag, X, Building } from 'lucide-react';
import { Contact } from './ContactsTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logContactAction } from '@/utils/contactLogger';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserProfileProps {
  contact: Contact;
  onSave?: (contact: Contact) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ contact, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(contact);
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const updatedTags = [...(formData.tags || []), newTag.trim()];
      setFormData(prev => ({ ...prev, tags: updatedTags }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (formData.tags || []).filter(tag => tag !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: updatedTags }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const currentTime = new Date().toISOString();
      const updateData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        status: formData.status,
        tags: formData.tags || [],
        updated_at: currentTime
      };
      
      console.log('Updating contact data:', updateData);
      
      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id)
        .select();
      
      if (error) {
        console.error('Error updating contact:', error);
        throw error;
      }
      
      console.log('Update response:', data);
      
      await logContactAction('update', {
        id: contact.id,
        ...updateData
      });
      
      if (!data || data.length === 0) {
        console.log('Contact updated but no data returned');
        
        const updatedContact = {
          ...contact,
          ...updateData,
          updated_at: currentTime
        };
        
        if (onSave) {
          onSave(updatedContact as Contact);
        }
        
        toast({
          title: 'Success',
          description: 'Contact updated successfully',
        });
        
        setIsEditing(false);
        return;
      }
      
      console.log('Contact updated successfully:', data);
      
      const transformedContact: Contact = {
        id: data[0].id,
        name: data[0].name,
        email: data[0].email || '',
        phone: data[0].phone || '',
        company: data[0].company || '',
        lastActivity: data[0].last_activity || '',
        status: data[0].status as 'active' | 'inactive',
        tags: data[0].tags || [],
        createdAt: data[0].created_at
      };
      
      if (onSave) {
        onSave(transformedContact);
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
        description: 'Failed to update contact. Please try again.',
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
    <div className="bg-white h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
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
        <form onSubmit={handleSubmit} className="space-y-3 p-4 overflow-y-auto">
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
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.tags || []).map(tag => (
                <Badge 
                  key={tag}
                  variant="secondary" 
                  className="px-2 py-1 flex items-center gap-1"
                >
                  {tag}
                  <button 
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex">
              <Input 
                id="newTag" 
                placeholder="Add new tag"
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="ml-2"
              >
                Add
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <ProfileItem icon={<User className="h-4 w-4" />} label="Name" value={contact.name} />
            <ProfileItem icon={<Phone className="h-4 w-4" />} label="Phone" value={contact.phone || 'Not provided'} />
            <ProfileItem icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email || 'Not provided'} />
            <ProfileItem icon={<Building className="h-4 w-4" />} label="Company" value={contact.company || 'Not provided'} />
            <ProfileItem 
              icon={<Calendar className="h-4 w-4" />}
              label="Last Activity" 
              value={formatDate(contact.lastActivity)} 
            />
            <ProfileItem 
              icon={<MapPin className="h-4 w-4" />} 
              label="Status" 
              value={
                <Badge variant={contact.status === 'active' ? 'success' : 'secondary'}>
                  {contact.status}
                </Badge>
              } 
            />
            <ProfileItem 
              icon={<AtSign className="h-4 w-4" />} 
              label="Created" 
              value={formatDate(contact.createdAt)} 
            />
            <div className="flex items-start gap-2">
              <div className="text-gray-400 mt-1"><Tag className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="px-2 py-0.5 text-xs">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

interface ProfileItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}

const ProfileItem = ({ icon, label, value }: ProfileItemProps) => (
  <div className="flex items-start gap-2">
    <div className="text-gray-400 mt-1">{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-gray-500">{label}</p>
      {typeof value === 'string' ? (
        <p className="font-medium">{value}</p>
      ) : (
        value
      )}
    </div>
  </div>
);

export default UserProfile;
