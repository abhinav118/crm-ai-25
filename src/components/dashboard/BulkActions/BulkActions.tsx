
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle, Send, Users, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TagSelectorDropdown from './components/TagSelectorDropdown';

interface BulkActionsProps {
  selectedContacts: string[];
  onContactsUpdated?: () => void;
}

interface ContactInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  company?: string;
}

interface SMSResult {
  contactId: string;
  success: boolean;
  error?: string;
}

const BulkActions: React.FC<BulkActionsProps> = ({ 
  selectedContacts,
  onContactsUpdated
}) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactInfo[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [selectedTagsFilter, setSelectedTagsFilter] = useState<string[]>([]);
  const [smsResults, setSmsResults] = useState<SMSResult[]>([]);
  const [isTagFilterMode, setIsTagFilterMode] = useState(false);

  // Phone validation helper
  const isValidPhone = (phone: string): boolean => {
    if (!phone || !phone.trim()) return false;
    // Remove all non-numeric characters and check if we have a valid phone number
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  // Fetch contacts based on current mode (tag filter vs selected contacts)
  const fetchContacts = async () => {
    setIsLoadingContacts(true);
    try {
      let data;
      let error;

      if (isTagFilterMode && selectedTagsFilter.length > 0) {
        // Tag filter mode: fetch ALL contacts that have any of the selected tags
        console.log("Fetching all contacts with tags:", selectedTagsFilter);
        
        const queries = selectedTagsFilter.map(tag => 
          supabase
            .from('contacts')
            .select('*')
            .contains('tags', [tag])
        );

        // Execute all queries and combine results
        const results = await Promise.all(queries);
        const allContacts = new Map<string, ContactInfo>();
        
        results.forEach(result => {
          if (result.data && !result.error) {
            result.data.forEach((contact: ContactInfo) => {
              allContacts.set(contact.id, contact);
            });
          }
        });

        data = Array.from(allContacts.values());
        error = results.find(r => r.error)?.error;
      } else {
        // Selected contacts mode: fetch only pre-selected contacts
        if (selectedContacts.length === 0) {
          setContacts([]);
          setFilteredContacts([]);
          return;
        }

        console.log("Fetching selected contacts:", selectedContacts);
        const result = await supabase
          .from('contacts')
          .select('*')
          .in('id', selectedContacts);
        
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error("Error fetching contacts:", error);
        toast({
          title: "Error",
          description: "Failed to load contact information.",
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        const contactsData = data as ContactInfo[];
        console.log("Fetched contacts:", contactsData.length, "contacts");
        setContacts(contactsData);
        setFilteredContacts(contactsData);
      }
    } catch (error) {
      console.error("Exception loading contacts:", error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Handle tag filter changes
  const handleTagsChange = (tags: string[]) => {
    console.log("Tag selection changed:", tags);
    setSelectedTagsFilter(tags);
    
    // Switch modes based on whether tags are selected
    const newTagFilterMode = tags.length > 0;
    if (newTagFilterMode !== isTagFilterMode) {
      setIsTagFilterMode(newTagFilterMode);
    }
  };

  const handleApplyTagFilter = () => {
    console.log("Applying tag filter manually");
    fetchContacts();
  };

  // Load contacts when mode changes or dependencies change
  useEffect(() => {
    fetchContacts();
  }, [selectedContacts, isTagFilterMode, selectedTagsFilter]);

  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    if (filteredContacts.length === 0) {
      toast({
        title: "Error",
        description: "No contacts available to send messages to.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    setSmsResults([]);
    
    try {
      const results: SMSResult[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Send SMS to each filtered contact
      for (const contact of filteredContacts) {
        if (!contact.phone || !isValidPhone(contact.phone)) {
          results.push({
            contactId: contact.id,
            success: false,
            error: 'Invalid or missing phone number'
          });
          errorCount++;
          continue;
        }

        try {
          // Call the Twilio edge function
          const { data, error } = await supabase.functions.invoke('send-sms', {
            body: {
              to: contact.phone,
              message: message,
              contactId: contact.id
            }
          });

          if (error || !data?.success) {
            results.push({
              contactId: contact.id,
              success: false,
              error: error?.message || data?.error || 'Failed to send SMS'
            });
            errorCount++;
          } else {
            results.push({
              contactId: contact.id,
              success: true
            });
            successCount++;

            // Log successful SMS in contact_logs
            await supabase.from('contact_logs').insert({
              action: 'sms_sent',
              contact_info: {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                status: contact.status,
                company: contact.company || null,
                tags: contact.tags || [],
                createdAt: contact.created_at,
                lastActivity: contact.updated_at || contact.created_at,
                timestamp: new Date().toISOString(),
                message: message
              },
              created_at: new Date().toISOString(),
              batch_id: null,
              batch_name: null
            });
          }
        } catch (error) {
          console.error(`Error sending SMS to ${contact.name}:`, error);
          results.push({
            contactId: contact.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          errorCount++;
        }
      }

      setSmsResults(results);

      // Show results toast
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: "SMS Sent Successfully",
          description: `Message sent to ${successCount} contact${successCount > 1 ? 's' : ''}.`,
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: "Partial Success",
          description: `Message sent to ${successCount} contacts. ${errorCount} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Send SMS",
          description: `Failed to send message to all ${errorCount} contacts.`,
          variant: "destructive",
        });
      }
      
      // Reset form on success
      if (successCount > 0) {
        setMessage("");
        setSelectedTagsFilter([]);
        setIsTagFilterMode(false);
      }
      
      if (onContactsUpdated) {
        onContactsUpdated();
      }
    } catch (error) {
      console.error("Error in bulk SMS sending:", error);
      toast({
        title: "Error",
        description: "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'lead':
        return <Badge className="bg-blue-100 text-blue-800">Lead</Badge>;
      case 'customer':
        return <Badge className="bg-purple-100 text-purple-800">Customer</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getValidContactsCount = () => {
    return filteredContacts.filter(contact => contact.phone && isValidPhone(contact.phone)).length;
  };

  // Check if the send button should be enabled
  const isSendButtonEnabled = () => {
    const validContactsCount = getValidContactsCount();
    return validContactsCount > 0 && message.trim().length > 0 && !isSending;
  };

  // Get display mode text
  const getDisplayModeText = () => {
    if (isTagFilterMode) {
      return `Showing all contacts with selected tags`;
    } else {
      return `Showing pre-selected contacts`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send SMS to Tagged Contacts
          </CardTitle>
          <CardDescription>
            Compose and send SMS messages to your contacts. Use tag filters to target all contacts with specific tags, or work with pre-selected contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode indicator */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isTagFilterMode ? 'bg-blue-500' : 'bg-green-500'}`} />
              <span className="font-medium">
                {isTagFilterMode ? 'Tag Filter Mode' : 'Selected Contacts Mode'}
              </span>
              <span className="text-muted-foreground">
                - {getDisplayModeText()}
              </span>
            </div>
          </div>

          {/* Tag Filter Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Filter Recipients by Tags</h3>
            <TagSelectorDropdown
              selectedTags={selectedTagsFilter}
              onTagsChange={handleTagsChange}
              onApplyFilter={handleApplyTagFilter}
            />
            {isTagFilterMode && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Tag filter mode: Searching all contacts in database with selected tags
              </div>
            )}
          </div>

          {/* Message Composition */}
          <div className="space-y-3">
            <label htmlFor="sms-message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="sms-message"
              placeholder="Type your message here..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {message.length}/160 characters
            </div>
          </div>

          {/* Recipients Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recipients ({getValidContactsCount()} with valid phone numbers)
              </h3>
              {selectedTagsFilter.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Filtered by {selectedTagsFilter.length} tag{selectedTagsFilter.length > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {isLoadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading contacts...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">
                  {isTagFilterMode 
                    ? "No contacts found with the selected tags"
                    : selectedContacts.length === 0 
                      ? "No contacts selected" 
                      : "No contacts available"
                  }
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tags</TableHead>
                        {smsResults.length > 0 && <TableHead>SMS Status</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => {
                        const smsResult = smsResults.find(r => r.contactId === contact.id);
                        return (
                          <TableRow key={contact.id}>
                            <TableCell className="font-medium">
                              {contact.name}
                              {contact.email && (
                                <div className="text-xs text-muted-foreground">
                                  {contact.email}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {contact.phone ? (
                                <span className={isValidPhone(contact.phone) ? "" : "text-red-500"}>
                                  {contact.phone}
                                </span>
                              ) : (
                                <span className="text-red-500 text-xs">No phone number</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(contact.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {contact.tags && contact.tags.length > 0 ? (
                                  contact.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">No tags</span>
                                )}
                              </div>
                            </TableCell>
                            {smsResults.length > 0 && (
                              <TableCell>
                                {smsResult ? (
                                  smsResult.success ? (
                                    <Badge className="bg-green-100 text-green-800">Sent</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Failed
                                    </Badge>
                                  )
                                ) : null}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSendSMS}
            disabled={!isSendButtonEnabled()}
            className="w-full"
            size="lg"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending SMS...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send SMS to {getValidContactsCount()} Contact{getValidContactsCount() !== 1 ? 's' : ''}
              </>
            )}
          </Button>

          {/* SMS Results Summary */}
          {smsResults.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">SMS Sending Results</h4>
              <div className="text-sm space-y-1">
                <div className="text-green-600">
                  ✓ {smsResults.filter(r => r.success).length} messages sent successfully
                </div>
                {smsResults.filter(r => !r.success).length > 0 && (
                  <div className="text-red-600">
                    ✗ {smsResults.filter(r => !r.success).length} messages failed
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkActions;
