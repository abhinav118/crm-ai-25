
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Contact } from '../ContactsTable';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getFullName } from '@/utils/contactHelpers';
import { 
  Save, 
  Send, 
  Search, 
  Filter,
  MessageSquare,
  Clock,
  User,
  Tag,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface BulkActionsTabProps {
  selectedContacts: Contact[];
  onActionComplete: () => void;
  onSelectionClear?: () => void;
}

const BulkActionsTab: React.FC<BulkActionsTabProps> = ({
  selectedContacts,
  onActionComplete,
  onSelectionClear
}) => {
  const [activeTab, setActiveTab] = useState('operations');
  const [isLoading, setIsLoading] = useState(false);
  
  // Operations state
  const [newStatus, setNewStatus] = useState('');
  const [tagsToAdd, setTagsToAdd] = useState('');
  const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState('');
  
  // SMS state
  const [smsMessage, setSmsMessage] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  
  // Activity logs state
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Handle bulk status update
  const handleStatusUpdate = async () => {
    if (!newStatus || selectedContacts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a status and contacts',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const contactIds = selectedContacts.map(contact => contact.id);
      
      const { error } = await supabase
        .from('contacts')
        .update({ status: newStatus })
        .in('id', contactIds);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Updated status for ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}`,
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update contact status',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk tag addition
  const handleAddTags = async () => {
    if (!tagsToAdd.trim() || selectedContacts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter tags and select contacts',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const newTags = tagsToAdd.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      for (const contact of selectedContacts) {
        const existingTags = contact.tags || [];
        const updatedTags = [...new Set([...existingTags, ...newTags])];
        
        const { error } = await supabase
          .from('contacts')
          .update({ tags: updatedTags })
          .eq('id', contact.id);
        
        if (error) throw error;
      }
      
      toast({
        title: 'Success',
        description: `Added tags to ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}`,
      });
      
      setTagsToAdd('');
      onActionComplete();
    } catch (error) {
      console.error('Error adding tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tags',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle bulk note addition
  const handleAddNote = async () => {
    if (!bulkNote.trim() || selectedContacts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter a note and select contacts',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      for (const contact of selectedContacts) {
        const { error } = await supabase
          .from('contacts')
          .update({ 
            notes: bulkNote,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id);
        
        if (error) throw error;
      }
      
      toast({
        title: 'Success',
        description: `Added note to ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}`,
      });
      
      setBulkNote('');
      onActionComplete();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle SMS sending
  const handleSendSMS = async () => {
    if (!smsMessage.trim() || selectedContacts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter a message and select contacts',
        variant: 'destructive'
      });
      return;
    }

    setSmsLoading(true);
    try {
      const contactsWithPhone = selectedContacts.filter(contact => contact.phone);
      
      if (contactsWithPhone.length === 0) {
        toast({
          title: 'Error',
          description: 'No selected contacts have phone numbers',
          variant: 'destructive'
        });
        return;
      }

      // Here you would integrate with your SMS service
      // For now, we'll just simulate the sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Success',
        description: `SMS sent to ${contactsWithPhone.length} contact${contactsWithPhone.length > 1 ? 's' : ''}`,
      });
      
      setSmsMessage('');
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: 'Error',
        description: 'Failed to send SMS',
        variant: 'destructive'
      });
    } finally {
      setSmsLoading(false);
    }
  };

  if (selectedContacts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts selected</h3>
          <p className="text-gray-500 text-center max-w-md">
            Select one or more contacts from the table above to perform bulk actions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Contacts Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selected Contacts ({selectedContacts.length})
          </CardTitle>
          <CardDescription>
            Perform bulk operations on the selected contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedContacts.slice(0, 5).map((contact) => (
              <Badge key={contact.id} variant="secondary">
                {getFullName(contact)}
              </Badge>
            ))}
            {selectedContacts.length > 5 && (
              <Badge variant="outline">
                +{selectedContacts.length - 5} more
              </Badge>
            )}
          </div>
          {onSelectionClear && (
            <Button variant="outline" size="sm" onClick={onSelectionClear}>
              Clear Selection
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Update Status
              </CardTitle>
              <CardDescription>
                Change the status for all selected contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleStatusUpdate} 
                  disabled={!newStatus || isLoading}
                  className="gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Update Status
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tag Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Manage Tags
              </CardTitle>
              <CardDescription>
                Add or remove tags for selected contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter tags separated by commas"
                    value={tagsToAdd}
                    onChange={(e) => setTagsToAdd(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddTags} 
                    disabled={!tagsToAdd.trim() || isLoading}
                    className="gap-2"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                    Add Tags
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Example: important, follow-up, vip
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Add Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Add Note
              </CardTitle>
              <CardDescription>
                Add the same note to all selected contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Enter note to add to all selected contacts..."
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!bulkNote.trim() || isLoading}
                  className="gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Send Bulk SMS
              </CardTitle>
              <CardDescription>
                Send the same SMS message to all selected contacts with phone numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Enter your SMS message..."
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={4}
                  maxLength={160}
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {smsMessage.length}/160 characters
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedContacts.filter(c => c.phone).length} contacts with phone numbers
                  </p>
                </div>
                <Button 
                  onClick={handleSendSMS} 
                  disabled={!smsMessage.trim() || smsLoading}
                  className="gap-2"
                >
                  {smsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>
                View and search activity history for selected contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search activity logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="calls">Calls</SelectItem>
                    <SelectItem value="emails">Emails</SelectItem>
                    <SelectItem value="meetings">Meetings</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Activity List */}
              <ScrollArea className="h-96 border rounded-md">
                <div className="p-4 space-y-4">
                  {selectedContacts.map((contact) => (
                    <div key={contact.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{getFullName(contact)}</span>
                        <Badge variant="outline" className="text-xs">
                          {contact.status}
                        </Badge>
                      </div>
                      <div className="ml-7 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>Last activity: {contact.lastActivity || 'No recent activity'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          <span>Email: {contact.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          <span>Tags: {contact.tags?.join(', ') || 'No tags'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedContacts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No activity logs found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkActionsTab;
