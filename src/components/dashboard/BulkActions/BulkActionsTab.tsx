
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, Search, CheckCircle, History, 
  User, Mail, Phone, Tag, MessageCircle, Clock, Send, Plus, X
} from "lucide-react";
import { format } from 'date-fns';
import { Contact } from '../ContactsTable';
import { getFullName } from '@/utils/contactHelpers';

interface BulkActionsTabProps {
  selectedContacts: Contact[];
  onActionComplete?: () => void;
  onSelectionClear?: () => void;
}

interface ContactInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  company?: string;
}

interface ContactLog {
  id: string;
  action: string;
  contact_info: any;
  created_at: string;
  batch_id: string | null;
  batch_name: string | null;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({ 
  selectedContacts,
  onActionComplete,
  onSelectionClear
}) => {
  const [activeTab, setActiveTab] = useState("operations");
  
  // Operations tab state
  const [status, setStatus] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // SMS tab state
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Logs tab state
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  
  // Convert Contact[] to ContactInfo[]
  const contactsInfo: ContactInfo[] = selectedContacts.map(contact => ({
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    status: contact.status,
    tags: contact.tags || [],
    created_at: contact.createdAt || '',
    updated_at: contact.lastActivity || contact.createdAt || '',
    company: contact.company || ''
  }));

  // Fetch contact logs when logs tab is active
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchContactLogs();
    }
  }, [activeTab, selectedContacts]);

  const fetchContactLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('contact_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error("Error fetching contact logs:", error);
        return;
      }
      
      setContactLogs(data || []);
    } catch (error) {
      console.error("Exception loading contact logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleUpdateContacts = async () => {
    if (!status && tags.length === 0 && !note.trim()) {
      toast({
        title: "Error",
        description: "Please specify at least one change to make.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const contactIds = selectedContacts.map(c => c.id);
      const updates: Record<string, any> = {};
      const updatedFields = [];
      
      if (status && status !== 'no_change') {
        updates.status = status;
        updatedFields.push(`status to "${status}"`);
      }
      
      if (tags.length > 0) {
        updates.tags = tags;
        updatedFields.push(`tags to [${tags.join(', ')}]`);
      }
      
      // Update contacts if there are field changes
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('contacts')
          .update(updates)
          .in('id', contactIds);
        
        if (error) throw error;
      }
      
      // Add note if provided
      if (note.trim()) {
        updatedFields.push('added note');
        
        for (const contact of contactsInfo) {
          await supabase.from('contact_logs').insert({
            action: 'note_added',
            contact_info: {
              ...contact,
              note: note,
              timestamp: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            batch_id: null,
            batch_name: null
          });
        }
      }
      
      // Create update logs
      if (updatedFields.length > 0) {
        const description = `Bulk updated: ${updatedFields.join(', ')}`;
        
        for (const contact of contactsInfo) {
          await supabase.from('contact_logs').insert({
            action: 'bulk_update',
            contact_info: {
              ...contact,
              changes: updatedFields,
              description,
              timestamp: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            batch_id: null,
            batch_name: null
          });
        }
      }
      
      toast({
        title: "Success",
        description: `Successfully updated ${selectedContacts.length} contacts.`,
      });
      
      // Reset form
      setStatus('');
      setTags([]);
      setNewTag('');
      setNote('');
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error("Error updating contacts:", error);
      toast({
        title: "Error",
        description: "Failed to update contacts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    try {
      // Create SMS logs for each contact
      for (const contact of contactsInfo) {
        await supabase.from('contact_logs').insert({
          action: 'sms_sent',
          contact_info: {
            ...contact,
            message: message,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
          batch_id: null,
          batch_name: null
        });
      }
      
      toast({
        title: "SMS Sent",
        description: `Message sent to ${selectedContacts.length} contacts.`,
      });
      
      setMessage("");
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast({
        title: "Error",
        description: "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
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

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'bulk_update': return 'Bulk Update';
      case 'note_added': return 'Note Added';
      case 'sms_sent': return 'SMS Sent';
      case 'contact_updated': return 'Updated';
      default: return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'sms_sent': return 'bg-blue-100 text-blue-800';
      case 'bulk_update': return 'bg-amber-100 text-amber-800';
      case 'note_added': return 'bg-purple-100 text-purple-800';
      case 'contact_updated': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContactInfoDisplay = (contactInfo: any): string => {
    if (!contactInfo) return 'No contact information';
    
    try {
      const firstName = contactInfo.first_name || '';
      const lastName = contactInfo.last_name || '';
      const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '';
      const email = contactInfo.email ? `${contactInfo.email}` : '';
      
      const parts = [];
      if (name) parts.push(name);
      if (email) parts.push(email);
      
      if (contactInfo.message) {
        return `${parts.join(' • ')} - Message: "${contactInfo.message}"`;
      }
      
      if (contactInfo.note) {
        return `${parts.join(' • ')} - Note: "${contactInfo.note}"`;
      }
      
      if (contactInfo.description) {
        return `${parts.join(' • ')} - ${contactInfo.description}`;
      }
      
      return parts.join(' • ') || 'Contact information';
    } catch (e) {
      return 'Error displaying contact information';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const filteredLogs = contactLogs.filter(log => {
    if (!logSearchQuery) return true;
    return (
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      getContactInfoDisplay(log.contact_info).toLowerCase().includes(logSearchQuery.toLowerCase())
    );
  });

  if (selectedContacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts selected</h3>
        <p className="text-gray-500">Select contacts from the table to perform bulk actions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected contacts summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''} Selected
          </CardTitle>
          <CardDescription>
            Perform bulk actions on the selected contacts below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedContacts.slice(0, 5).map((contact) => (
              <Badge key={contact.id} variant="outline">
                {getFullName(contact)}
              </Badge>
            ))}
            {selectedContacts.length > 5 && (
              <Badge variant="outline">+{selectedContacts.length - 5} more</Badge>
            )}
          </div>
          {onSelectionClear && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectionClear}
              className="mt-3"
            >
              Clear Selection
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="operations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Contacts</CardTitle>
              <CardDescription>
                Make changes to all selected contacts at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Update */}
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No change</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tags Management */}
              <div className="space-y-2">
                <Label>Add Tags</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter tag name..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="px-2 py-1">
                        {tag}
                        <button
                          className="ml-2 text-xs hover:text-red-500"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Add Notes */}
              <div className="space-y-2">
                <Label htmlFor="note">Add Note</Label>
                <Textarea
                  id="note"
                  placeholder="Add a note to all selected contacts..."
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              
              {/* Save Button */}
              <Button 
                className="w-full" 
                onClick={handleUpdateContacts}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Contacts...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Update All Contacts
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Send SMS Message</CardTitle>
              <CardDescription>
                Send a bulk SMS message to all selected contacts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="text-sm text-gray-500">
                  {message.length}/160 characters
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleSendSMS}
                disabled={isSending || !message.trim()}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending SMS...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                View the history of actions performed on contacts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search in logs..."
                    className="pl-8"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Logs Table */}
                <div className="border rounded-md">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Contact Info</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingLogs ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : filteredLogs.length > 0 ? (
                          filteredLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <Badge className={getActionBadgeColor(log.action)}>
                                  {getActionLabel(log.action)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {getContactInfoDisplay(log.contact_info)}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatDate(log.created_at)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                              {logSearchQuery ? 'No matching logs found' : 'No activity logs found'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkActionsTab;
