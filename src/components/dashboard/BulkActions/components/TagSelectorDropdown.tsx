
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TagSelectorDropdownProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onApplyFilter: () => void;
}

const TagSelectorDropdown: React.FC<TagSelectorDropdownProps> = ({
  selectedTags,
  onTagsChange,
  onApplyFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch available tags from Supabase
  const fetchAvailableTags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('tags')
        .not('tags', 'is', null);

      if (error) throw error;

      // Extract unique tags from all contacts
      const allTags = new Set<string>();
      data.forEach(contact => {
        if (contact.tags && Array.isArray(contact.tags)) {
          contact.tags.forEach((tag: string) => {
            if (tag && tag.trim()) {
              allTags.add(tag.trim());
            }
          });
        }
      });

      const uniqueTags = Array.from(allTags).sort();
      setAvailableTags(uniqueTags);
      setFilteredTags(uniqueTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tags. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tags based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTags(availableTags);
    } else {
      const filtered = availableTags.filter(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTags(filtered);
    }
  }, [searchQuery, availableTags]);

  // Fetch tags when component mounts or dropdown opens
  useEffect(() => {
    if (isOpen && availableTags.length === 0) {
      fetchAvailableTags();
    }
  }, [isOpen]);

  const handleTagToggle = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newSelectedTags);
  };

  const handleSelectAll = () => {
    onTagsChange(filteredTags);
  };

  const handleClearSelection = () => {
    onTagsChange([]);
  };

  const handleApplyFilter = () => {
    onApplyFilter();
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>
                {selectedTags.length === 0
                  ? 'Select tags to filter contacts'
                  : `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                }
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3 border-b">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredTags.length === 0}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                disabled={selectedTags.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-60">
            <div className="p-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading tags...</span>
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {availableTags.length === 0 ? 'No tags found' : 'No matching tags'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <label
                        htmlFor={`tag-${tag}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <Button
              onClick={handleApplyFilter}
              className="w-full"
              disabled={selectedTags.length === 0}
            >
              Apply Filter ({selectedTags.length} selected)
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Display selected tags as badges */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagSelectorDropdown;
