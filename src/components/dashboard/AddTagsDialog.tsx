
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, Tag, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Avatar from '@/components/dashboard/Avatar';
import { Contact } from './ContactsTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logContactAction } from '@/utils/contactLogger';

interface AddTagsDialogProps {
  open: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
  onTagsAdded: () => void;
}

const AddTagsDialog: React.FC<AddTagsDialogProps> = ({
  open,
  onClose,
  selectedContacts,
  onTagsAdded
}) => {
  const [actionName, setActionName] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sample predefined tags - in a real app, these might come from the database
  const predefinedTags = ['customer', 'lead', 'important', 'num verified', 'vip', 'potential', 'cold', 'hot'];
  
  const filteredTags = predefinedTags.filter(tag => 
    tag.toLowerCase().includes(searchTag.toLowerCase()) && 
    !selectedTags.includes(tag)
  );

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setSearchTag('');
  };

  const handleCreateTag = () => {
    if (searchTag.trim() && !selectedTags.includes(searchTag.trim())) {
      setSelectedTags([...selectedTags, searchTag.trim()]);
      setSearchTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const validateForm = () => {
    if (!actionName.trim()) {
      setErrorMessage('Action name is required');
      return false;
    }
    if (selectedTags.length === 0) {
      setErrorMessage('At least one tag is required');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Process each contact
      for (const contact of selectedContacts) {
        // Get current tags
        const { data: contactData, error: fetchError } = await supabase
          .from('contacts')
          .select('tags')
          .eq('id', contact.id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Combine existing tags with new ones, removing duplicates
        const currentTags = contactData.tags || [];
        const updatedTags = [...new Set([...currentTags, ...selectedTags])].filter(Boolean);
        
        // Update the contact with new tags
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ 
            tags: updatedTags,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);
          
        if (updateError) throw updateError;
        
        // Log the tag update action
        await logContactAction('update', {
          id: contact.id,
          name: contact.name,
          tags: updatedTags,
          action_name: actionName
        });
      }
      
      toast({
        title: 'Tags Added',
        description: `Successfully added tags to ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}`,
      });
      
      onTagsAdded();
      onClose();
    } catch (error) {
      console.error('Error adding tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tags. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Tags</DialogTitle>
          <DialogDescription>
            Specified tags will get added to all the selected contacts
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-lg font-medium mb-4">Add tags to following contacts</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedContacts.map(contact => (
              <Avatar key={contact.id} name={contact.name} status={contact.status} />
            ))}
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="actionName" className="block text-sm font-medium mb-1">
                Action Name <span className="text-red-500">*</span>
              </label>
              <Input 
                id="actionName"
                placeholder="Enter a description for the action"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="w-full"
              />
              {errorMessage && actionName.trim() === '' && (
                <p className="text-sm text-red-500 mt-1">Enter a name for the action</p>
              )}
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1">
                Tags <span className="text-red-500">*</span>
              </label>
              
              <div className="relative mb-2">
                <div className="border rounded-md p-2 flex items-center">
                  <div className="mr-2">Please select tags</div>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-auto h-4 w-4 opacity-50"
                  >
                    <path
                      d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.26618 11.9026 7.38064 11.95 7.49999 11.95C7.61933 11.95 7.73379 11.9026 7.81819 11.8182L10.0682 9.56819Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
              </div>
              
              <div className="border rounded-md">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search / create tags"
                      value={searchTag}
                      onChange={(e) => setSearchTag(e.target.value)}
                      className="pl-8 pr-8"
                    />
                    {searchTag && (
                      <button
                        onClick={handleCreateTag}
                        className="absolute right-2 top-2.5"
                      >
                        <Plus className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="p-2">
                  {/* Selected tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="px-2 py-1 flex items-center gap-1"
                      >
                        {tag}
                        <button 
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Tag suggestions */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filteredTags.slice(0, 5).map(tag => (
                      <Badge 
                        key={tag} 
                        variant="outline"
                        className="px-2 py-1 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {errorMessage && selectedTags.length === 0 && (
                <p className="text-sm text-red-500 mt-1">At least one tag is required</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Tags'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTagsDialog;
