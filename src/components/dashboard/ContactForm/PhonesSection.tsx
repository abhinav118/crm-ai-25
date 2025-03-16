
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
            onChange={(e) => onPhoneChange(index, 'number', e.target.value)}
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
