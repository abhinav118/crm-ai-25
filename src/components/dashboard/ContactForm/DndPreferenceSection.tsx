
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';
import { ContactFormValues } from './types';

interface DndPreferenceSectionProps {
  form: UseFormReturn<ContactFormValues>;
}

const DndPreferenceSection: React.FC<DndPreferenceSectionProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="dndPreference"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>Communication Preferences (DND)</FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="space-y-2"
            >
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
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DndPreferenceSection;
