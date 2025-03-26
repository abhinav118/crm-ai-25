
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Send, Tag, Users, TagsIcon, 
  Smile, PaperclipIcon, ImageIcon, AlertCircle, 
  Check, ChevronsUpDown
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { logContactAction } from '@/utils/contactLogger';
import { Contact } from '../ContactsTable';

interface BulkActionsProps {
  selectedContacts: string[];
  onClose?: () => void;
  onContactsUpdated?: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({ 
  selectedContacts, 
  onClose,
  onContactsUpdated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredContactIds, setFilteredContactIds] = useState<string[]>(selectedContacts);
  const [openTagSelector, setOpenTagSelector] = useState(false);
  const { toast } = useToast();

  // Fetch contacts data for the selected contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (selectedContacts.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .in('id', selectedContacts);
        
        if (error) throw error;
        
        if (data) {
          // Map database fields to Contact type
          const formattedContacts: Contact[] = data.map(contact => ({
            id: contact.id,
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            status: contact.status as 'active' | 'inactive',
            tags: contact.tags || [],
            lastActivity: contact.last_activity || contact.created_at,
            createdAt: contact.created_at
          }));
          
          setContacts(formattedContacts);
          
          // Extract all unique tags from contacts
          const tags = new Set<string>();
          data.forEach(contact => {
            if (contact.tags && Array.isArray(contact.tags)) {
              contact.tags.forEach(tag => tags.add(tag));
            }
          });
          
          setAvailableTags(Array.from(tags));
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load contacts',
          variant: 'destructive',
        });
      }
    };
    
    fetchContacts();
  }, [selectedContacts, toast]);
  
  // Filter contacts based on selected tags
  useEffect(() => {
    if (selectedTags.length === 0) {
      // If no tags selected, show all contacts
      setFilteredContactIds(selectedContacts);
      return;
    }
    
    // Filter contacts that have at least one of the selected tags
    const filtered = contacts.filter(contact => {
      if (!contact.tags || !Array.isArray(contact.tags)) return false;
      return selectedTags.some(tag => contact.tags.includes(tag));
    }).map(contact => contact.id);
    
    setFilteredContactIds(filtered);
  }, [selectedTags, contacts, selectedContacts]);
  
  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };
  
  const handleTagSelection = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast({
        title: 'Missing Message',
        description: 'Please enter a message to send',
        variant: 'destructive',
      });
      return;
    }
    
    if (filteredContactIds.length === 0) {
      toast({
        title: 'No Contacts Selected',
        description: 'Please select at least one contact to send SMS',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the contact information for the filtered contacts
      const filteredContacts = contacts.filter(contact => filteredContactIds.includes(contact.id));
      
      // Keep track of successful sends
      const successfulSends: string[] = [];
      
      // Send SMS to each contact
      for (const contact of filteredContacts) {
        if (!contact.phone) continue;
        
        // Call the Supabase Edge Function to send SMS
        const response = await fetch('https://nzsflibcvrisxjlzuxjn.supabase.co/functions/v1/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: contact.phone,
            message: message,
            contactId: contact.id
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          successfulSends.push(contact.id);
          
          // Log the SMS action for this contact
          await logContactAction('message_sent', {
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            company: contact.company,
            status: contact.status,
            tags: contact.tags,
            message: message,
            channel: 'sms',
            timestamp: new Date().toISOString()
          });
        } else {
          console.error(`Failed to send SMS to ${contact.name}:`, result.error);
        }
      }
      
      // Show success message
      toast({
        title: 'SMS Sent',
        description: `Successfully sent SMS to ${successfulSends.length} contacts`,
      });
      
      // Clear the message
      setMessage('');
      
      // Close the dialog if needed
      if (onClose) onClose();
      
      // Trigger contacts refresh if needed
      if (onContactsUpdated) onContactsUpdated();
      
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: 'Error',
        description: 'Failed to send SMS. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Send className="mr-2 h-5 w-5" />
            Send SMS
          </CardTitle>
          <CardDescription>
            Send SMS messages to your selected contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Tag filtering section - REPLACED with multi-select dropdown */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filter by Tags</Label>
              <Popover open={openTagSelector} onOpenChange={setOpenTagSelector}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTagSelector}
                    className="w-full justify-between"
                  >
                    {selectedTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden">
                        {selectedTags.length <= 2 ? (
                          selectedTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="mr-1">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <>
                            <Badge variant="secondary" className="mr-1">
                              {selectedTags[0]}
                            </Badge>
                            <Badge variant="secondary">
                              +{selectedTags.length - 1} more
                            </Badge>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select tags to filter contacts</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandList>
                      <CommandEmpty>No tags found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-60">
                          {availableTags.map((tag) => (
                            <CommandItem
                              key={tag}
                              value={tag}
                              onSelect={() => handleTagSelection(tag)}
                            >
                              <div className="flex items-center">
                                <Checkbox
                                  checked={selectedTags.includes(tag)}
                                  className="mr-2 h-4 w-4"
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleTagSelection(tag);
                                    } else {
                                      handleTagSelection(tag);
                                    }
                                  }}
                                />
                                <span className="flex items-center">
                                  <Tag className="mr-2 h-3 w-3" />
                                  {tag}
                                </span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                    <div className="border-t p-2 flex justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTags([])}
                        className="text-xs"
                      >
                        Clear selection
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTags(availableTags)}
                        className="text-xs"
                      >
                        Select all
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpenTagSelector(false)}
                        className="text-xs"
                      >
                        Apply filter
                      </Button>
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button 
                        className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                        onClick={() => handleTagSelection(tag)}
                      >
                        <AlertCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {selectedTags.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedTags([])}
                      className="h-5 text-xs px-2"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Recipient count indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <Users className="mr-2 h-4 w-4" />
                <span>
                  {filteredContactIds.length === 0 
                    ? 'No recipients selected' 
                    : `${filteredContactIds.length} recipient${filteredContactIds.length !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
            
            <Separator />
            
            {/* Message composition area */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">Message</Label>
              <div className="relative">
                <Textarea
                  id="message"
                  placeholder="Type your SMS message here..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="pr-10"
                />
                
                {/* Character count indicator */}
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {message.length} / 160 characters
                  {message.length > 160 && (
                    <span className="text-destructive ml-1">
                      (Message will be split)
                    </span>
                  )}
                </div>
                
                {/* Emoji button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 bottom-2"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Emoji picker */}
              {showEmojiPicker && (
                <div className="relative z-10">
                  <div className="absolute right-0">
                    <Picker 
                      data={data} 
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                      previewPosition="none"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Warning message if no contacts selected */}
            {filteredContactIds.length === 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      No contacts are currently selected based on your tag filters.
                      Either clear the tag filter or select different tags.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Send button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSendSMS}
                disabled={isLoading || filteredContactIds.length === 0 || !message.trim()}
                className="w-24"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkActions;
