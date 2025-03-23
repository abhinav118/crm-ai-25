
import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterValue } from './FilterDialog';

type TimeUnit = 'days' | 'weeks' | 'months' | 'years';

type CreatedFilterProps = {
  value?: FilterValue;
  onChange: (value?: FilterValue) => void;
};

const CreatedFilter: React.FC<CreatedFilterProps> = ({ value, onChange }) => {
  const [operator, setOperator] = useState<string>(value?.operator || 'moreThan');
  const [timeValue, setTimeValue] = useState<string>(value?.value?.toString() || '');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>((value?.unit as TimeUnit) || 'days');

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    updateFilter(newOperator, timeValue, timeUnit);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTimeValue(newValue);
    
    if (newValue) {
      updateFilter(operator, newValue, timeUnit);
    } else {
      // If value is empty, don't apply the filter
      onChange(undefined);
    }
  };

  const handleUnitChange = (newUnit: TimeUnit) => {
    setTimeUnit(newUnit);
    updateFilter(operator, timeValue, newUnit);
  };

  const updateFilter = (op: string, val: string, unit: TimeUnit) => {
    if (val) {
      onChange({
        type: 'created',
        operator: op,
        value: parseInt(val, 10) || 0,
        unit
      });
    }
  };

  return (
    <div className="space-y-6 py-6">
      <h2 className="text-lg font-medium border-b pb-2">Created</h2>
      
      <RadioGroup 
        value={operator} 
        onValueChange={handleOperatorChange}
        className="space-y-4"
      >
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="moreThan" id="created-more-than" className="mt-1" />
          <div className="grid gap-1.5 w-full">
            <Label htmlFor="created-more-than">More Than</Label>
            {operator === 'moreThan' && (
              <div className="flex gap-2">
                <Input 
                  type="number"
                  placeholder="Please Input" 
                  value={timeValue}
                  onChange={handleValueChange}
                  className="flex-1"
                />
                <Select value={timeUnit} onValueChange={handleUnitChange as (value: string) => void}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">days ago</SelectItem>
                    <SelectItem value="weeks">weeks ago</SelectItem>
                    <SelectItem value="months">months ago</SelectItem>
                    <SelectItem value="years">years ago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {operator === 'moreThan' && !timeValue && (
              <p className="text-destructive text-sm">* Enter a value</p>
            )}
            <p className="text-muted-foreground text-sm">*per EDT time zone</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="lessThan" id="created-less-than" />
          <Label htmlFor="created-less-than">Less Than</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="range" id="created-range" />
          <Label htmlFor="created-range">Range</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default CreatedFilter;
