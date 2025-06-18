
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { logContactAction } from '@/utils/contactLogger';

interface ManageSegmentTagsProps {
  onActionComplete: () => void;
}

const ManageSegmentTags: React.FC<ManageSegmentTagsProps> = ({ onActionComplete }) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contactCount, setContactCount] = useState<number | null>(null);

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

  // Get contact count for selected segment
  React.useEffect(() => {
    const getContactCount = async () => {
      if (!selectedSegment) {
        setContactCount(null);
        return;
      }

      try {
        const { count, error } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('segment_name', selectedSegment);

        if (error) throw error;
        setContactCount(count || 0);
      } catch (error) {
        console.error('Error fetching contact count:', error);
        setContactCount(0);
      }
    };

    getContactCount();
  }, [selectedSegment]);

  const handleAddTag = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTags(newTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleApplyTags = async () => {
    if (!selectedSegment || newTags.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a segment and add at least one tag.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // First, get all contacts in the segment
      const { data: contacts, error: fetchError } = await supabase
        .from('contacts')
        .select('id, tags, first_name, last_name')
        .eq('segment_name', selectedSegment);

      if (fetchError) throw fetchError;

      if (!contacts || contacts.length === 0) {
        toast({
          title: 'No contacts found',
          description: `No contacts found in segment "${selectedSegment}".`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Update each contact with merged tags
      const updatePromises = contacts.map(async (contact) => {
        const existingTags = contact.tags || [];
        const mergedTags = [...new Set([...existingTags, ...newTags])];
        
        const { error } = await supabase
          .from('contacts')
          .update({ tags: mergedTags })
          .eq('id', contact.id);

        if (error) throw error;

        // Log the action
        await logContactAction('update', {
          id: contact.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          tags: mergedTags
        }, `Added tags: ${newTags.join(', ')} to segment "${selectedSegment}"`);
      });

      await Promise.all(updatePromises);

      toast({
        title: 'Success',
        description: `Added ${newTags.length} tag(s) to ${contacts.length} contact(s) in segment "${selectedSegment}".`,
      });

      // Reset form
      setNewTags([]);
      setSelectedSegment('');
      setContactCount(null);
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      onActionComplete();

    } catch (error) {
      console.error('Error applying tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply tags. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canApplyTags = selectedSegment && newTags.length > 0 && !isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Manage Segment Tags
        </CardTitle>
        <p className="text-sm text-gray-600">
          Apply tags to all contacts within a specific segment. No individual contact selection needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Segment Selector */}
        <div className="space-y-2">
          <Label htmlFor="segment-select">Select Segment</Label>
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger id="segment-select">
              <SelectValue placeholder="Choose a segment" />
            </SelectTrigger>
            <SelectContent>
              {segments.map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {segment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contactCount !== null && (
            <p className="text-sm text-gray-500">
              {contactCount} contact(s) in this segment
            </p>
          )}
        </div>

        {/* Tags Input */}
        <div className="space-y-2">
          <Label htmlFor="tag-input">Add Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tag-input"
              placeholder="Enter tag name"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Display added tags */}
          {newTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {newTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleApplyTags}
          disabled={!canApplyTags}
          className="w-full"
        >
          {isLoading ? 'Applying Tags...' : 'Add Tags to Segment'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ManageSegmentTags;
