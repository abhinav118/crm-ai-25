
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PhoneEntry } from './types';

interface PhonesSectionProps {
  phones: PhoneEntry[];
  onPhoneChange: (index: number, field: 'type' | 'number', value: string) => void;
  onAddPhone: () => void;
  onRemovePhone: (index: number) => void;
}

const PhonesSection: React.FC<PhonesSectionProps> = ({
  phones,
  onPhoneChange,
  onAddPhone,
  onRemovePhone
}) => {
  // Helper to format phone numbers as they're typed
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Apply formatting based on number of digits
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else {
      return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handlePhoneInputChange = (index: number, value: string) => {
    // Format the phone number as it's being typed
    onPhoneChange(index, 'number', value);
  };

  return (
    <div className="space-y-2">
      <Label>Phone Numbers</Label>
      {phones.map((phone, index) => (
        <div key={index} className="flex gap-2">
          <Select
            value={phone.type}
            onValueChange={(value) => onPhoneChange(index, 'type', value)}
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
            onChange={(e) => handlePhoneInputChange(index, e.target.value)}
            className="flex-1"
          />
          {phones.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemovePhone(index)}
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
        onClick={onAddPhone}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" /> Add Another Phone
      </Button>
    </div>
  );
};

export default PhonesSection;
