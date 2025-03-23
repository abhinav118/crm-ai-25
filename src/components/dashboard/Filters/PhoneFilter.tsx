
import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FilterValue } from './FilterDialog';

type PhoneFilterProps = {
  value?: FilterValue;
  onChange: (value?: FilterValue) => void;
};

const PhoneFilter: React.FC<PhoneFilterProps> = ({ value, onChange }) => {
  const [operator, setOperator] = useState<string>(value?.operator || 'is');
  const [phoneValue, setPhoneValue] = useState<string>((value?.value as string) || '');

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    
    // If changing to isEmpty or isNotEmpty, we don't need a value
    if (newOperator === 'isEmpty' || newOperator === 'isNotEmpty') {
      onChange({
        type: 'phone',
        operator: newOperator,
        value: null
      });
    } else {
      onChange({
        type: 'phone',
        operator: newOperator,
        value: phoneValue
      });
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPhoneValue(newValue);
    
    if (newValue) {
      onChange({
        type: 'phone',
        operator,
        value: newValue
      });
    } else if (newValue === '') {
      // If value is empty, don't apply the filter
      onChange(undefined);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <h2 className="text-lg font-medium border-b pb-2">Phone</h2>
      
      <RadioGroup 
        value={operator} 
        onValueChange={handleOperatorChange}
        className="space-y-4"
      >
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="is" id="phone-is" className="mt-1" />
          <div className="grid gap-1.5 w-full">
            <Label htmlFor="phone-is">Is</Label>
            {operator === 'is' && (
              <>
                <Input 
                  placeholder="Please Input" 
                  value={phoneValue}
                  onChange={handleValueChange}
                />
                {!phoneValue && (
                  <p className="text-destructive text-sm">* At least one Phone is required</p>
                )}
                <p className="text-muted-foreground text-sm">
                  To search contacts with international number, prefix your search with +zzz (where zzz means a country dial code).
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isNot" id="phone-is-not" />
          <Label htmlFor="phone-is-not">Is not</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isEmpty" id="phone-is-empty" />
          <Label htmlFor="phone-is-empty">Is empty</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isNotEmpty" id="phone-is-not-empty" />
          <Label htmlFor="phone-is-not-empty">Is not empty</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default PhoneFilter;
