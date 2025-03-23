import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FilterValue } from './FilterDialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
      // If value is empty and operator requires a value, don't apply the filter yet
      if (operator === 'is' || operator === 'isNot') {
        // Don't submit an empty value filter
      } else {
        onChange({
          type: 'email',
          operator,
          value: null
        });
      }
    }
  };

  const clearInput = () => {
    setEmailValue('');
    // If operator doesn't require a value, keep it
    if (operator === 'isEmpty' || operator === 'isNotEmpty') {
      onChange({
        type: 'email',
        operator,
        value: null
      });
    } else {
      // Otherwise don't apply the filter yet
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
              <div className="relative">
                <Input 
                  placeholder="Please Input" 
                  value={emailValue}
                  onChange={handleValueChange}
                  className="pr-8"
                />
                {emailValue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={clearInput}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {operator === 'is' && !emailValue && (
                  <p className="text-destructive text-sm">* required</p>
                )}
                <p className="text-muted-foreground text-sm">
                  Input examples, builder: somebody@myCompany.com, @myCompany.com, *myCompany.com, some*company*.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="isNot" id="email-is-not" className="mt-1" />
          <div className="grid gap-1.5 w-full">
            <Label htmlFor="email-is-not">Is not</Label>
            {operator === 'isNot' && (
              <div className="relative">
                <Input 
                  placeholder="Please Input" 
                  value={emailValue}
                  onChange={handleValueChange}
                  className="pr-8"
                />
                {emailValue && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={clearInput}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {operator === 'isNot' && !emailValue && (
                  <p className="text-destructive text-sm">* required</p>
                )}
              </div>
            )}
          </div>
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
