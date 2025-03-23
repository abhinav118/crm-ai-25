
import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FilterValue } from './FilterDialog';

type EmailFilterProps = {
  value?: FilterValue;
  onChange: (value?: FilterValue) => void;
};

const EmailFilter: React.FC<EmailFilterProps> = ({ value, onChange }) => {
  const [operator, setOperator] = useState<string>(value?.operator || 'is');
  const [emailValue, setEmailValue] = useState<string>((value?.value as string) || '');

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    
    // If changing to isEmpty or isNotEmpty, we don't need a value
    if (newOperator === 'isEmpty' || newOperator === 'isNotEmpty') {
      onChange({
        type: 'email',
        operator: newOperator,
        value: null
      });
    } else {
      onChange({
        type: 'email',
        operator: newOperator,
        value: emailValue
      });
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEmailValue(newValue);
    
    if (newValue) {
      onChange({
        type: 'email',
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
      <h2 className="text-lg font-medium border-b pb-2">Email</h2>
      
      <RadioGroup 
        value={operator} 
        onValueChange={handleOperatorChange}
        className="space-y-4"
      >
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="is" id="email-is" className="mt-1" />
          <div className="grid gap-1.5 w-full">
            <Label htmlFor="email-is">Is</Label>
            {operator === 'is' && (
              <>
                <Input 
                  placeholder="Please Input" 
                  value={emailValue}
                  onChange={handleValueChange}
                />
                {!emailValue && (
                  <p className="text-destructive text-sm">* required</p>
                )}
                <p className="text-muted-foreground text-sm">
                  Input examples, builder: somebody@myCompany.com, @myCompany.com, *myCompany.com, some*company*.
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isNot" id="email-is-not" />
          <Label htmlFor="email-is-not">Is not</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isEmpty" id="email-is-empty" />
          <Label htmlFor="email-is-empty">Is empty</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isNotEmpty" id="email-is-not-empty" />
          <Label htmlFor="email-is-not-empty">Is not empty</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default EmailFilter;
