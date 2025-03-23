
import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FilterValue } from './FilterDialog';

type TagFilterProps = {
  value?: FilterValue;
  onChange: (value?: FilterValue) => void;
};

const TagFilter: React.FC<TagFilterProps> = ({ value, onChange }) => {
  const [operator, setOperator] = useState<string>(value?.operator || 'is');
  const [tagValue, setTagValue] = useState<string>((value?.value as string) || '');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('tags');
          
        if (error) throw error;
        
        // Extract unique tags from all contacts
        const allTags = new Set<string>();
        data.forEach(contact => {
          if (contact.tags && Array.isArray(contact.tags)) {
            contact.tags.forEach((tag: string) => allTags.add(tag));
          }
        });
        
        setAvailableTags(Array.from(allTags));
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    
    fetchTags();
  }, []);

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    
    // If changing to isEmpty or isNotEmpty, we don't need a value
    if (newOperator === 'isEmpty' || newOperator === 'isNotEmpty') {
      onChange({
        type: 'tag',
        operator: newOperator,
        value: null
      });
    } else {
      onChange({
        type: 'tag',
        operator: newOperator,
        value: tagValue
      });
    }
  };

  const handleValueChange = (newValue: string) => {
    setTagValue(newValue);
    
    if (newValue) {
      onChange({
        type: 'tag',
        operator,
        value: newValue
      });
    } else {
      // If value is empty, don't apply the filter
      onChange(undefined);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <h2 className="text-lg font-medium border-b pb-2">Tag</h2>
      
      <RadioGroup 
        value={operator} 
        onValueChange={handleOperatorChange}
        className="space-y-4"
      >
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="is" id="tag-is" className="mt-1" />
          <div className="grid gap-1.5 w-full">
            <Label htmlFor="tag-is">Is</Label>
            {operator === 'is' && (
              <Select value={tagValue} onValueChange={handleValueChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Please Select" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map(tag => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isNot" id="tag-is-not" />
          <Label htmlFor="tag-is-not">Is not</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isEmpty" id="tag-is-empty" />
          <Label htmlFor="tag-is-empty">Is empty</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="isNotEmpty" id="tag-is-not-empty" />
          <Label htmlFor="tag-is-not-empty">Is not empty</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="anyOf" id="tag-any-of" />
          <Label htmlFor="tag-any-of">Any of</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default TagFilter;
