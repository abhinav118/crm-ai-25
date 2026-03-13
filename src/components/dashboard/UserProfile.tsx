import React, { useState, useEffect } from 'react';
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
import { syncContactToSegment } from '@/utils/segmentSync';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFullName } from '@/utils/contactHelpers';
import { formatPhoneNumber } from '@/utils/phoneFormatter';

interface UserProfileProps {
  contact: Contact;
  onSave?: (contact: Contact) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ contact, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: contact.first_name,
    last_name: contact.last_name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    company: contact.company || '',
    status: contact.status,
    tags: contact.tags || [],
    segment_name: contact.segment_name || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [availableSegments, setAvailableSegments] = useState<string[]>([]);
  const [isUpdatingSegment, setIsUpdatingSegment] = useState(false);

  // Fetch available segments on component mount
  useEffect(() => {
    fetchAvailableSegments();
  }, []);

  const fetchAvailableSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts_segments')
        .select('segment_name');
      
      if (error) throw error;
      
      const segments = data?.map(s => s.segment_name) || [];
      setAvailableSegments(segments);
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

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

  const handleSegmentUpdate = async () => {
    if (!formData.segment_name) {
      toast({
        title: 'Error',
        description: 'Please select a segment',
        variant: 'destructive'
      });
      return;
    }

    setIsUpdatingSegment(true);
    
    try {
      const updatedAt = new Date().toISOString();

      // Update source of truth on contact record
      const { data: updatedContactRow, error: contactError } = await supabase
        .from('contacts')
        .update({ segment_name: formData.segment_name, updated_at: updatedAt })
        .eq('id', contact.id)
        .select()
        .single();

      if (contactError) throw contactError;

      // Keep membership view in sync via service-role edge function (avoids RLS writes from client)
      const baseContact = updatedContactRow || contact;
      await syncContactToSegment({
        id: baseContact.id,
        first_name: baseContact.first_name ?? contact.first_name,
        last_name: baseContact.last_name ?? contact.last_name,
        email: baseContact.email ?? contact.email,
        phone: baseContact.phone ?? contact.phone,
        company: baseContact.company ?? contact.company,
        status: baseContact.status ?? contact.status,
        tags: baseContact.tags ?? contact.tags ?? [],
        created_at: (baseContact as any).created_at ?? contact.createdAt,
        updated_at: updatedAt,
        segment_name: formData.segment_name
      });

      // Update local contact data
      const updatedContact = {
        ...contact,
        segment_name: formData.segment_name
      };

      if (onSave) {
        onSave(updatedContact as Contact);
      }

      toast({
        title: 'Success',
        description: 'Contact segment updated successfully'
      });

    } catch (error) {
      console.error('Error updating segment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update segment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingSegment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const currentTime = new Date().toISOString();

      if(formData.phone){
        console.log("update phone format", formData.phone)
        formData.phone = formatPhoneNumber(formData.phone);
        console.log("---updated phone format", formData.phone)

      }
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        status: formData.status,
        tags: formData.tags || [],
        segment_name: formData.segment_name || null,
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
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        ...updateData
      });
      
      if (!data || data.length === 0) {
        console.log('Contact updated but no data returned');
        
        const updatedContact = {
          ...contact,
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          email: updateData.email,
          phone: updateData.phone,
          company: updateData.company,
          status: updateData.status,
          tags: updateData.tags,
          segment_name: updateData.segment_name,
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
        first_name: data[0].first_name,
        last_name: data[0].last_name,
        email: data[0].email || '',
        phone: data[0].phone || '',
        company: data[0].company || '',
        last_activity: data[0].last_activity || '',
        status: data[0].status as 'active' | 'inactive',
        tags: data[0].tags || [],
        segment_name: data[0].segment_name || '',
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
        <ScrollArea className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-3 p-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input 
                id="first_name" 
                name="first_name"
                value={formData.first_name} 
                onChange={handleChange} 
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input 
                id="last_name" 
                name="last_name"
                value={formData.last_name} 
                onChange={handleChange} 
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
              <Label htmlFor="segment">Segment</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.segment_name} 
                  onValueChange={(value) => handleSelectChange('segment_name', value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSegments.map(segment => (
                      <SelectItem key={segment} value={segment}>
                        {segment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleSegmentUpdate}
                  disabled={isUpdatingSegment || !formData.segment_name}
                >
                  {isUpdatingSegment ? 'Updating...' : 'Update Segment'}
                </Button>
              </div>
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
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <ProfileItem icon={<User className="h-5 w-5" />} label="Name" value={getFullName(contact)} />
              <ProfileItem icon={<Phone className="h-5 w-5" />} label="Phone" value={contact.phone || 'Not provided'} />
              <ProfileItem icon={<Mail className="h-5 w-5" />} label="Email" value={contact.email || 'Not provided'} />
              <ProfileItem icon={<Building className="h-5 w-5" />} label="Company" value={contact.company || 'Not provided'} />
              <ProfileItem 
                icon={<Award className="h-5 w-5" />} 
                label="Segment" 
                value={contact.segment_name || 'No segment assigned'} 
              />
              <ProfileItem 
                icon={<Calendar className="h-5 w-5" />}
                label="Last Activity" 
                value={formatDate(contact.last_activity)}
              />
              <ProfileItem 
                icon={<MapPin className="h-5 w-5" />} 
                label="Status" 
                value={
                  <Badge variant={contact.status === 'active' ? 'success' : 'secondary'}>
                    {contact.status}
                  </Badge>
                } 
              />
              <ProfileItem 
                icon={<AtSign className="h-5 w-5" />} 
                label="Created" 
                value={formatDate(contact.createdAt)} 
              />
              <div className="flex items-start gap-3">
                <div className="text-gray-400 mt-1"><Tag className="h-5 w-5" /></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Tags</p>
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
  <div className="flex items-start gap-3">
    <div className="text-gray-400 mt-1">{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      {typeof value === 'string' ? (
        <p className="font-medium">{value}</p>
      ) : (
        value
      )}
    </div>
  </div>
);

export default UserProfile;
