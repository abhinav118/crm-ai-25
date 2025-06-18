
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Tag, Send, Download, Users } from 'lucide-react';
import { Contact } from '../ContactsTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BulkActionsTab from './BulkActionsTab';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getFullName } from '@/utils/contactHelpers';

interface BulkActionsProps {
  selectedContacts: Contact[];
  onContactsUpdated: () => void;
  onSelectionClear: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedContacts,
  onContactsUpdated,
  onSelectionClear
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('actions');
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;
    
    setIsLoading(true);
    try {
      const contactIds = selectedContacts.map(contact => contact.id);
      
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''} deleted successfully`,
      });
      
      onContactsUpdated();
      onSelectionClear();
      setShowDialog(false);
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contacts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedContacts.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Tags', 'Created At'];
    
    const rows = selectedContacts.map(contact => [
      getFullName(contact),
      contact.email || '',
      contact.phone || '',
      contact.company || '',
      contact.status,
      (contact.tags || []).join(', '),
      contact.createdAt ? new Date(contact.createdAt).toLocaleString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: `${selectedContacts.length} contacts exported to CSV`,
    });
  };

  const handleActionComplete = () => {
    onContactsUpdated();
    setShowDialog(false);
  };

  if (selectedContacts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white rounded-full shadow-lg border px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{selectedContacts.length} selected</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDialog(true)}
              className="gap-1"
            >
              <Tag className="h-4 w-4" />
              Actions
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Perform actions on {selectedContacts.length} selected contact{selectedContacts.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
              <TabsTrigger value="messaging">Messaging</TabsTrigger>
              <TabsTrigger value="tags">Tags & Status</TabsTrigger>
            </TabsList>
            
            <div className="mt-4 overflow-y-auto max-h-[60vh]">
              <TabsContent value="actions">
                <BulkActionsTab
                  selectedContacts={selectedContacts}
                  onActionComplete={handleActionComplete}
                />
              </TabsContent>
              
              <TabsContent value="messaging">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Send bulk messages to selected contacts</p>
                  {/* Messaging functionality would go here */}
                </div>
              </TabsContent>
              
              <TabsContent value="tags">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Manage tags and status for selected contacts</p>
                  {/* Tags management functionality would go here */}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkActions;
