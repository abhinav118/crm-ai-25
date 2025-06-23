
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Plus, Minus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ManageSegmentMembershipProps {
  onActionComplete: () => void;
  segmentFilter?: string;
  availableSegments?: string[];
  onSegmentFilterChange?: (segment: string) => void;
}

const ManageSegmentMembership: React.FC<ManageSegmentMembershipProps> = ({
  onActionComplete,
  availableSegments = [],
}) => {
  const [operationType, setOperationType] = useState<'add' | 'remove'>('add');
  const [targetSegment, setTargetSegment] = useState('');
  const [newSegmentName, setNewSegmentName] = useState('');
  const [inputMethod, setInputMethod] = useState<'manual' | 'csv'>('manual');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.trim();
    // Support formats: (xxx) xxx-xxxx, +1xxxxxxxxxx, xxxxxxxxxx
    const phoneRegex = /^(\(\d{3}\)\s\d{3}-\d{4}|\+1\d{10}|\d{10})$/;
    return phoneRegex.test(cleanPhone);
  };

  // Parse CSV file
  const parseCSV = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').map(line => line.trim()).filter(line => line);
          // Assuming phone numbers are in the first column
          const phoneNumbers = lines.map(line => line.split(',')[0].trim());
          resolve(phoneNumbers);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Get phone numbers from input
  const getPhoneNumbers = async (): Promise<string[]> => {
    if (inputMethod === 'manual') {
      return phoneNumbers.split('\n').map(phone => phone.trim()).filter(phone => phone);
    } else if (inputMethod === 'csv' && csvFile) {
      return await parseCSV(csvFile);
    }
    return [];
  };

  // Find contacts by phone numbers
  const findContactsByPhone = async (phones: string[]) => {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, phone, first_name, last_name, segment_name')
      .in('phone', phones);
    
    if (error) throw error;
    return data || [];
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!targetSegment && !newSegmentName) {
      toast({
        title: 'Missing Target',
        description: 'Please select a segment or create a new one',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setValidationErrors([]);
    
    try {
      // Get phone numbers from input
      const inputPhones = await getPhoneNumbers();
      
      if (inputPhones.length === 0) {
        toast({
          title: 'No Input',
          description: 'Please provide phone numbers',
          variant: 'destructive'
        });
        return;
      }

      // Validate phone numbers
      const errors: string[] = [];
      const validPhones: string[] = [];
      
      inputPhones.forEach((phone, index) => {
        if (!validatePhoneNumber(phone)) {
          errors.push(`Line ${index + 1}: Invalid phone format "${phone}"`);
        } else {
          validPhones.push(phone);
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: 'Validation Errors',
          description: `${errors.length} phone number(s) have invalid format`,
          variant: 'destructive'
        });
        return;
      }

      // Find matching contacts
      const matchingContacts = await findContactsByPhone(validPhones);
      
      if (matchingContacts.length === 0) {
        toast({
          title: 'No Matches Found',
          description: 'No contacts found matching the provided phone numbers. Please double check the input formatting.',
          variant: 'destructive'
        });
        return;
      }

      // Determine the segment to use
      const segmentToUse = newSegmentName.trim() || targetSegment;
      
      // Update contacts
      const updatedContacts = matchingContacts.map(contact => {
        let updatedSegmentName = contact.segment_name;
        
        if (operationType === 'add') {
          updatedSegmentName = segmentToUse;
        } else if (operationType === 'remove') {
          updatedSegmentName = contact.segment_name === segmentToUse ? null : contact.segment_name;
        }
        
        return {
          id: contact.id,
          segment_name: updatedSegmentName,
          updated_at: new Date().toISOString()
        };
      });

      // Batch update contacts
      const { error: updateError } = await supabase
        .from('contacts')
        .upsert(updatedContacts);

      if (updateError) throw updateError;

      // Show success message
      const actionText = operationType === 'add' ? 'added to' : 'removed from';
      toast({
        title: 'Success',
        description: `${matchingContacts.length} contacts ${actionText} segment "${segmentToUse}" successfully`,
      });

      // Reset form
      setPhoneNumbers('');
      setCsvFile(null);
      setNewSegmentName('');
      setValidationErrors([]);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-segments'] });
      onActionComplete();
      
    } catch (error) {
      console.error('Error updating segment membership:', error);
      toast({
        title: 'Error',
        description: 'Failed to update segment membership. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {operationType === 'add' ? (
              <Plus className="h-5 w-5 text-green-600" />
            ) : (
              <Minus className="h-5 w-5 text-red-600" />
            )}
            Manage Segment Membership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Operation Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Operation Type</Label>
            <Select value={operationType} onValueChange={(value: 'add' | 'remove') => setOperationType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    Add to Segment
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    Remove from Segment
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Segment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Segment</Label>
            <Select value={targetSegment} onValueChange={setTargetSegment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select existing segment..." />
              </SelectTrigger>
              <SelectContent>
                {availableSegments.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create New Segment (only in Add mode) */}
          {operationType === 'add' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Or Create New Segment</Label>
              <Input
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                placeholder="Enter new segment name..."
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                If filled, this will create a new segment. Leave empty to use selected segment above.
              </p>
            </div>
          )}

          {/* Contact Input Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Contact Input Method</Label>
            <Tabs value={inputMethod} onValueChange={(value: 'manual' | 'csv') => setInputMethod(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Input</TabsTrigger>
                <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-2">
                <Label className="text-sm font-medium">Phone Numbers</Label>
                <Textarea
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  placeholder="Enter phone numbers (one per line)&#10;Examples:&#10;(555) 123-4567&#10;+15551234567&#10;5551234567"
                  rows={8}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Supported formats: (xxx) xxx-xxxx, +1xxxxxxxxxx, xxxxxxxxxx
                </p>
              </TabsContent>
              
              <TabsContent value="csv" className="space-y-2">
                <Label className="text-sm font-medium">Upload CSV File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-500"
                    >
                      Choose CSV file
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    CSV should have phone numbers in the first column
                  </p>
                  {csvFile && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-600">Validation Errors</Label>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-32 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600">{error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || (!targetSegment && !newSegmentName)}
            className="w-full"
          >
            {isLoading ? 'Processing...' : `${operationType === 'add' ? 'Add to' : 'Remove from'} Segment`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageSegmentMembership;
