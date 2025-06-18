
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Users, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { logContactAction } from '@/utils/contactLogger';

interface ManageSegmentMembershipProps {
  onActionComplete: () => void;
}

const ManageSegmentMembership: React.FC<ManageSegmentMembershipProps> = ({ onActionComplete }) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [newSegmentName, setNewSegmentName] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'manual' | 'csv'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [operationType, setOperationType] = useState<'add' | 'remove'>('add');

  const queryClient = useQueryClient();

  // Fetch available segments
  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('segment_name')
        .not('segment_name', 'is', null);
      
      if (error) throw error;
      
      const uniqueSegments = [...new Set(data.map(item => item.segment_name))];
      return uniqueSegments.filter(Boolean);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Extract phone numbers from CSV - assuming they're in the first column or find phone-like patterns
      const lines = text.split('\n');
      const phones = lines
        .map(line => {
          // Try to extract phone numbers from each line
          const match = line.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s*\d{3}[-.]?\d{4}/);
          return match ? match[0] : line.trim();
        })
        .filter(phone => phone && phone.length > 0)
        .join('\n');
      
      setPhoneNumbers(phones);
    };
    reader.readAsText(file);
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add +1 if it's a 10-digit number
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // Add + if it's an 11-digit number starting with 1
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return phone; // Return original if format is unexpected
  };

  const validateAndFormatPhones = (phoneList: string[]): string[] => {
    return phoneList
      .filter(phone => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
      })
      .map(formatPhoneNumber);
  };

  const handleUpdateMembership = async () => {
    const targetSegment = newSegmentName.trim() || selectedSegment;
    
    if (!targetSegment || !phoneNumbers.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both segment name and phone numbers.',
        variant: 'destructive',
      });
      return;
    }

    if (operationType === 'remove' && !selectedSegment) {
      toast({
        title: 'Error',
        description: 'Please select an existing segment to remove contacts from.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Parse phone numbers
      const phoneList = phoneNumbers
        .split('\n')
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);

      const validPhones = validateAndFormatPhones(phoneList);
      
      if (validPhones.length === 0) {
        toast({
          title: 'Error',
          description: 'No valid phone numbers found.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Find matching contacts
      const { data: contacts, error: fetchError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, phone, segment_name')
        .in('phone', validPhones);

      if (fetchError) throw fetchError;

      if (!contacts || contacts.length === 0) {
        toast({
          title: 'No matches found',
          description: 'No contacts found matching the provided phone numbers.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Update segment membership
      const updateValue = operationType === 'add' ? targetSegment : null;
      const updatePromises = contacts.map(async (contact) => {
        const { error } = await supabase
          .from('contacts')
          .update({ segment_name: updateValue })
          .eq('id', contact.id);

        if (error) throw error;

        // Log the action with 2 arguments
        const actionDescription = operationType === 'add' 
          ? `Added to segment "${targetSegment}"` 
          : `Removed from segment "${contact.segment_name}"`;
          
        await logContactAction('update', {
          id: contact.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          segment_name: updateValue,
          description: actionDescription
        });
      });

      await Promise.all(updatePromises);

      const actionText = operationType === 'add' ? 'added to' : 'removed from';
      const segmentText = operationType === 'add' ? targetSegment : 'their segments';
      
      toast({
        title: 'Success',
        description: `${contacts.length} contact(s) ${actionText} ${segmentText}.`,
      });

      // Reset form
      setPhoneNumbers('');
      setNewSegmentName('');
      setSelectedSegment('');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      onActionComplete();

    } catch (error) {
      console.error('Error updating membership:', error);
      toast({
        title: 'Error',
        description: 'Failed to update segment membership. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canUpdateMembership = phoneNumbers.trim() && 
    (operationType === 'add' ? (selectedSegment || newSegmentName.trim()) : selectedSegment) && 
    !isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Manage Segment Membership
        </CardTitle>
        <p className="text-sm text-gray-600">
          Add or remove contacts to/from segments using phone numbers.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Operation Type */}
        <div className="space-y-2">
          <Label>Operation Type</Label>
          <Tabs value={operationType} onValueChange={(value: 'add' | 'remove') => setOperationType(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add to Segment
              </TabsTrigger>
              <TabsTrigger value="remove" className="flex items-center gap-2">
                <Minus className="h-4 w-4" />
                Remove from Segment
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Segment Selection */}
        <div className="space-y-2">
          <Label htmlFor="segment-select">
            {operationType === 'add' ? 'Target Segment' : 'Remove from Segment'}
          </Label>
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger id="segment-select">
              <SelectValue placeholder="Choose existing segment" />
            </SelectTrigger>
            <SelectContent>
              {segments.map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {segment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* New Segment Name (only for add operation) */}
        {operationType === 'add' && (
          <div className="space-y-2">
            <Label htmlFor="new-segment">Or Create New Segment</Label>
            <Input
              id="new-segment"
              placeholder="Enter new segment name"
              value={newSegmentName}
              onChange={(e) => setNewSegmentName(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Leave empty to use selected segment above
            </p>
          </div>
        )}

        {/* Upload Method */}
        <div className="space-y-2">
          <Label>Contact Input Method</Label>
          <Tabs value={uploadMethod} onValueChange={(value: 'manual' | 'csv') => setUploadMethod(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone-numbers">Phone Numbers</Label>
                <Textarea
                  id="phone-numbers"
                  placeholder="Enter phone numbers (one per line)&#10;Example:&#10;(555) 123-4567&#10;555-123-4567&#10;5551234567"
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  rows={8}
                />
                <p className="text-xs text-gray-500">
                  Enter one phone number per line. Supports various formats.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="csv" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="csv-upload">Upload CSV File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <Upload className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">
                  Upload a CSV file containing phone numbers. Phone numbers will be automatically detected.
                </p>
                {phoneNumbers && (
                  <Textarea
                    value={phoneNumbers}
                    onChange={(e) => setPhoneNumbers(e.target.value)}
                    rows={6}
                    placeholder="Extracted phone numbers will appear here..."
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleUpdateMembership}
          disabled={!canUpdateMembership}
          className="w-full"
          variant={operationType === 'remove' ? 'destructive' : 'default'}
        >
          {isLoading ? 'Processing...' : 
            operationType === 'add' ? 'Add to Segment' : 'Remove from Segment'
          }
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManageSegmentMembership;
