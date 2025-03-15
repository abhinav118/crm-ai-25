
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Edit2, Calendar, Phone, Mail, User, MapPin, Award, AtSign } from 'lucide-react';
import { Contact } from './ContactsTable';

interface UserProfileProps {
  contact: Contact;
  onSave?: (contact: Contact) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ contact, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(contact);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit2 size={16} className="mr-1" />
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName"
                value={formData.name.split(' ')[0]} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName"
                value={formData.name.split(' ').slice(1).join(' ')} 
                onChange={handleChange} 
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email"
              value={formData.email} 
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
            <Label htmlFor="source">Contact Source</Label>
            <Input 
              id="source" 
              name="source"
              placeholder="Website/Referral/Other" 
              onChange={handleChange} 
            />
          </div>
          <div className="mt-4">
            <Button type="submit" className="w-full">Save Changes</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-1 gap-3">
            <ProfileItem icon={<User />} label="Name" value={contact.name} />
            <ProfileItem icon={<Mail />} label="Email" value={contact.email} />
            <ProfileItem icon={<Phone />} label="Phone" value={contact.phone || 'Not provided'} />
            <ProfileItem icon={<Award />} label="Company" value={contact.company || 'Not provided'} />
            <ProfileItem icon={<Calendar />} label="Last Activity" value={contact.lastActivity || 'No activity'} />
            <ProfileItem icon={<MapPin />} label="Status" value={contact.status} />
            <ProfileItem icon={<AtSign />} label="Created" value={contact.createdAt} />
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
