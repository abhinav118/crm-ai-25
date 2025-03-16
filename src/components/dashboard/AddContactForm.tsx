
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImagePlus, Plus, Trash } from 'lucide-react';

interface AddContactFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddContactForm: React.FC<AddContactFormProps> = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    tags: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phones, setPhones] = useState([{ type: 'mobile', number: '' }]);
  const [emails, setEmails] = useState(['']);

  const handleAddPhone = () => {
    setPhones([...phones, { type: 'mobile', number: '' }]);
  };

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        email: emails[0], // Use the first email as the primary
        phone: phones[0]?.number, // Use the first phone as the primary
        phonetype: phones[0]?.type
      };
      
      await onSubmit(submissionData);
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        tags: []
      });
      setPhones([{ type: 'mobile', number: '' }]);
      setEmails(['']);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div>
              <Label htmlFor="firstName">First Name*</Label>
              <Input 
                required 
                id="firstName" 
                name="firstName" 
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name*</Label>
              <Input 
                required 
                id="lastName" 
                name="lastName" 
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company">Company</Label>
            <Input 
              id="company" 
              name="company" 
              value={formData.company}
              onChange={handleInputChange}
            />
          </div>

          {/* Email Addresses */}
          <div className="space-y-2">
            <Label>Email Addresses</Label>
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    const newEmails = [...emails];
                    newEmails[index] = e.target.value;
                    setEmails(newEmails);
                  }}
                />
                {emails.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newEmails = emails.filter((_, i) => i !== index);
                      setEmails(newEmails);
                    }}
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
                  defaultValue={phone.type}
                  onValueChange={(value) => {
                    const newPhones = [...phones];
                    newPhones[index].type = value;
                    setPhones(newPhones);
                  }}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
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
                  onChange={(e) => {
                    const newPhones = [...phones];
                    newPhones[index].number = e.target.value;
                    setPhones(newPhones);
                  }}
                  className="flex-1"
                />
                {phones.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newPhones = phones.filter((_, i) => i !== index);
                      setPhones(newPhones);
                    }}
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
          <div className="space-y-2">
            <Label>Communication Preferences (DND)</Label>
            <div className="space-y-2">
              <RadioGroup defaultValue="all">
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
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Contact
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactForm;
