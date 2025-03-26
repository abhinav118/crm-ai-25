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
  Loader2, Search, Filter, ChevronsUpDown, ArrowUpDown, 
  User, Mail, Phone, Tag, MessageCircle, History, 
  CheckCircle, AlertCircle, Info, Calendar, Clock, Send
} from "lucide-react";
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import BulkActions from './BulkActions';

interface BulkActionsTabProps {
  selectedContacts: string[];
  onActionComplete?: () => void;
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

interface ContactLog {
  id: string;
  action: string;
  contact_info: any; // Using 'any' to accommodate various JSON structures
  created_at: string;
  batch_id: string | null;
  batch_name: string | null;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({ 
  selectedContacts,
  onActionComplete
}) => {
  const [activeTab, setActiveTab] = useState("summary");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Contact info state
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  // Contact logs state
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Load contact logs
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchContactLogs();
    }
  }, [activeTab, selectedContacts, logsPage, logTypeFilter, sortOrder]);
  
  const fetchSelectedContacts = async () => {
    if (selectedContacts.length === 0) return;
    
    setIsLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .in('id', selectedContacts);
      
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
        setContacts(data as ContactInfo[]);
      }
    } catch (error) {
      console.error("Exception loading contacts:", error);
    } finally {
      setIsLoadingContacts(false);
    }
  };
  
  const fetchContactLogs = async (isNewSearch = false): Promise<void> => {
    // if (selectedContacts.length === 0) return;
    
    setIsLoadingLogs(true);
    try {
      console.log('Fetching contact logs for selected contacts:', selectedContacts);
      
      // Simply get all logs without filtering
      const { data, error } = await supabase
        .from('contact_logs')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'asc' });
      
      if (error) {
        console.error("Error fetching contact logs:", error);
        toast({
          title: "Error",
          description: "Failed to load contact logs. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        console.log('Received contact logs data:', data);
        
        // Cast to ContactLog[] for TypeScript
        const typedData = data as ContactLog[];
        
        // For new searches, replace existing data, otherwise append
        setContactLogs(prev => isNewSearch ? typedData : [...prev, ...typedData]);
        setHasMoreLogs(typedData.length === 20);
      }
    } catch (error) {
      console.error("Exception loading contact logs:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLogs(false);
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
      // Implement your SMS sending logic here
      // For each contact in selectedContacts...
      
      // Create logs for SMS sent - updated to use correct schema
      for (const contactId of selectedContacts) {
        const contactData = contacts.find(c => c.id === contactId);
        if (contactData) {
          // Generate a log matching the schema structure we saw in sample data
          await supabase.from('contact_logs').insert({
            action: 'sms_sent',
            contact_info: {
              id: contactId,
              name: contactData.name,
              email: contactData.email,
              phone: contactData.phone,
              status: contactData.status,
              company: contactData.company || null,
              tags: contactData.tags || [],
              createdAt: contactData.created_at,
              lastActivity: contactData.updated_at || contactData.created_at,
              timestamp: new Date().toISOString(),
              message: message
            },
            created_at: new Date().toISOString(),
            batch_id: null,
            batch_name: null
          });
        }
      }
      
      toast({
        title: "SMS Sent",
        description: `Message sent to ${selectedContacts.length} contacts.`,
      });
      
      // Reset form
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
      // Track what was updated for logs
      const updatedFields = [];
      const updates: Record<string, any> = {};
      
      if (status && status !== 'no_change') {
        updates.status = status;
        updatedFields.push(`status to "${status}"`);
      }
      
      if (tags.length > 0) {
        updates.tags = tags;
        updatedFields.push(`tags to [${tags.join(', ')}]`);
      }
      
      // Only proceed with update if there are fields to update
      if (Object.keys(updates).length > 0) {
        // Update all selected contacts
        const { error } = await supabase
          .from('contacts')
          .update(updates)
          .in('id', selectedContacts);
        
        if (error) {
          throw error;
        }
      }
      
      // Add note if provided
      if (note.trim()) {
        updatedFields.push('added note');
        
        // Add a log entry for each contact - updated to use correct schema
        for (const contactId of selectedContacts) {
          const contactData = contacts.find(c => c.id === contactId);
          if (contactData) {
            await supabase.from('contact_logs').insert({
              action: 'note_added',
              contact_info: {
                id: contactId,
                name: contactData.name,
                email: contactData.email,
                phone: contactData.phone,
                status: contactData.status,
                company: contactData.company || null,
                tags: contactData.tags || [],
                createdAt: contactData.created_at,
                lastActivity: contactData.updated_at || contactData.created_at,
                timestamp: new Date().toISOString(),
                note: note
              },
              created_at: new Date().toISOString(),
              batch_id: null,
              batch_name: null
            });
          }
        }
      }
      
      // Create logs for updates - updated to use correct schema
      if (updatedFields.length > 0) {
        const description = `Bulk updated: ${updatedFields.join(', ')}`;
        
        for (const contactId of selectedContacts) {
          const contactData = contacts.find(c => c.id === contactId);
          if (contactData) {
            await supabase.from('contact_logs').insert({
              action: 'contact_updated',
              contact_info: {
                id: contactId,
                name: contactData.name,
                email: contactData.email,
                phone: contactData.phone,
                status: contactData.status,
                company: contactData.company || null,
                tags: contactData.tags || [],
                createdAt: contactData.created_at,
                lastActivity: contactData.updated_at || contactData.created_at,
                timestamp: new Date().toISOString(),
                changes: updatedFields,
                description
              },
              created_at: new Date().toISOString(),
              batch_id: null,
              batch_name: null
            });
          }
        }
      }
      
      toast({
        title: "Contacts Updated",
        description: `Successfully updated ${selectedContacts.length} contacts.`,
      });
      
      // Refresh contact data
      fetchSelectedContacts();
      
      // Reset form
      setStatus(null);
      setTags([]);
      setNewTag("");
      setNote("");
      
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
  
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
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
      case 'contact_updated': return 'Update';
      case 'note_added': return 'Note';
      case 'sms_sent': return 'SMS';
      case 'message_sent': return 'SMS';
      case 'email_sent': return 'Email';
      case 'call_logged': return 'Call';
      default: return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };
  
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'sms_sent': return 'bg-blue-100 text-blue-800';
      case 'message_sent': return 'bg-blue-100 text-blue-800';
      case 'contact_updated': return 'bg-amber-100 text-amber-800';
      case 'note_added': return 'bg-purple-100 text-purple-800';
      case 'email_sent': return 'bg-green-100 text-green-800';
      case 'call_logged': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getContactInfoDisplay = (contactInfo: ContactLog['contact_info']): string => {
    if (!contactInfo) return 'No contact information';
    
    try {
      // If it's already a string, return it
      if (typeof contactInfo === 'string') return contactInfo;
      
      // Prioritize showing name, email, and phone if they exist
      const name = contactInfo.name ? `${contactInfo.name}` : '';
      const email = contactInfo.email ? `${contactInfo.email}` : '';
      const phone = contactInfo.phone ? `${contactInfo.phone}` : '';
      
      // If we have these primary identifiers, show them
      if (name || email || phone) {
        const parts = [];
        if (name) parts.push(name);
        if (email) parts.push(email);
        if (phone) parts.push(phone);
        return parts.join(' • ');
      }
      
      // If we have a timestamp, include it
      const timestamp = contactInfo.timestamp ? `at ${format(new Date(contactInfo.timestamp), 'HH:mm:ss')}` : '';
      
      // For updates and other actions, show what action was performed
      if (contactInfo.description) {
        return contactInfo.description + (timestamp ? ` ${timestamp}` : '');
      }
      
      // For messages or notes, prioritize them
      if (contactInfo.message) {
        return `Message: "${contactInfo.message}"` + (timestamp ? ` ${timestamp}` : '');
      }
      
      if (contactInfo.note) {
        return `Note: "${contactInfo.note}"` + (timestamp ? ` ${timestamp}` : '');
      }
      
      // For other cases, show a summarized version
      const maxEntries = 3;
      const entries = Object.entries(contactInfo)
        .filter(([key, _]) => !['id', 'timestamp', 'createdAt', 'lastActivity'].includes(key))
        .slice(0, maxEntries);
      
      if (entries.length === 0) return 'No details';
      
      return entries
        .map(([key, value]) => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'object') return `${key}: ${JSON.stringify(value).substring(0, 30)}...`;
          return `${key}: ${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}`;
        })
        .filter(Boolean)
        .join(', ') + (timestamp ? ` ${timestamp}` : '');
    } catch (e) {
      console.error('Error displaying contact info:', e);
      return 'Error displaying contact information';
    }
  };
  
  // Function to format the date in a readable way
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Function to truncate ID values for display
  const truncateId = (id: string): string => {
    if (!id) return '-';
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  };
  
  // Replacing the logs table section in the UI
  const renderContactLogsTable = () => {
    return (
      <div className="border rounded-md overflow-hidden">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
                <TableHead className="w-auto">Contact Info</TableHead>
                <TableHead className="w-[180px]">Created At</TableHead>
                <TableHead className="w-[100px]">Batch ID</TableHead>
                <TableHead className="w-[120px]">Batch Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactLogs.length > 0 ? (
                contactLogs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-muted/30">
                    <TableCell className="align-top font-mono text-xs">
                      {truncateId(log.id)}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge className={`${getActionBadgeColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-sm">
                        {getContactInfoDisplay(log.contact_info)}
                      </div>
                      {log.contact_info?.id && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Contact ID: {truncateId(log.contact_info.id)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell className="align-top font-mono text-xs">
                      {log.batch_id ? truncateId(log.batch_id) : '-'}
                    </TableCell>
                    <TableCell className="align-top text-xs">
                      {log.batch_name || '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {isLoadingLogs ? (
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground py-8">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <span className="font-medium mb-1">No activity logs found</span>
                        <span className="text-sm">Actions performed on these contacts will appear here</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };
  
  // Function to create a test log entry for debugging
  const createTestLogEntry = async () => {
    if (selectedContacts.length === 0) {
      toast({
        title: "No Contacts Selected",
        description: "Please select at least one contact to create a test log.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const contactId = selectedContacts[0];
      const contactData = contacts.find(c => c.id === contactId);
      
      if (!contactData) {
        toast({
          title: "Error",
          description: "Contact data not found.",
          variant: "destructive"
        });
        return;
      }
      
      // Create a test log entry
      const { data, error } = await supabase.from('contact_logs').insert({
        action: 'test_action',
        contact_info: {
          id: contactId,
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          status: contactData.status,
          company: contactData.company || null,
          tags: contactData.tags || [],
          createdAt: contactData.created_at,
          lastActivity: contactData.updated_at || contactData.created_at,
          timestamp: new Date().toISOString(),
          message: "This is a test log entry"
        },
        created_at: new Date().toISOString(),
        batch_id: null,
        batch_name: null
      }).select();
      
      if (error) {
        console.error("Error creating test log:", error);
        toast({
          title: "Error",
          description: "Failed to create test log entry.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Created test log entry:", data);
      toast({
        title: "Test Log Created",
        description: "Successfully created a test log entry. Check the logs tab."
      });
      
      // Refresh logs
      fetchContactLogs(true);
    } catch (error) {
      console.error("Exception creating test log:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Operations tabs */}
      <Tabs
        defaultValue="summary"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="summary">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Operations
            </div>
          </TabsTrigger>
          <TabsTrigger value="sms">
            <div className="flex items-center">
              <Send className="h-4 w-4 mr-2" />
              Send SMS
            </div>
          </TabsTrigger>
          <TabsTrigger value="logs">
            <div className="flex items-center">
              <History className="h-4 w-4 mr-2" />
              Activity Logs
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Update Contacts</CardTitle>
              <CardDescription>
                Make changes to all selected contacts at once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status || ''} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_change">No change</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Add a tag..."
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
                      <Tag className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="px-2 py-1">
                          {tag}
                          <button
                            className="ml-2 text-xs"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            ✕
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
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
                
                <Button 
                  className="w-full" 
                  onClick={handleUpdateContacts}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>Update All Contacts</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sms">
          <BulkActions 
            selectedContacts={selectedContacts} 
            onContactsUpdated={onActionComplete}
          />
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Contact Activity Logs</CardTitle>
              <CardDescription>
                View the history of actions performed on the selected contacts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search in logs..."
                      className="pl-8"
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleSortToggle}
                    title={sortOrder === 'desc' ? "Newest first" : "Oldest first"}
                  >
                    {sortOrder === 'desc' ? (
                      <>
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Newest first</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Oldest first</span>
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Logs table */}
                {renderContactLogsTable()}
                
                {/* Load more button */}
                {hasMoreLogs && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLoadingLogs}
                    onClick={() => setLogsPage(prev => prev + 1)}
                  >
                    {isLoadingLogs ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Load more logs</>
                    )}
                  </Button>
                )}
                
                {/* Debug button - only visible in development */}
                {process.env.NODE_ENV !== 'production' && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={createTestLogEntry}
                    >
                      Create Test Log Entry
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      (Debug button - only visible in development)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Add a named export alongside the default export for better compatibility
export { BulkActionsTab };

// Maintain the default export
export default BulkActionsTab;
