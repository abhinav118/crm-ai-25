import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  UserPlus,
  Send,
  Download,
  Trash2,
  Tag,
  Upload 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddTagsDialog from './AddTagsDialog';
import SendMessageDialog from './SendMessageDialog';
import { Contact } from './ContactsTable';
import { useToast } from '@/hooks/use-toast';
import ImportContactsDialog from './ImportContactsDialog/ImportContactsDialog';
import { getFullName } from '@/utils/contactHelpers';

type ActionButtonsProps = {
  selectedCount?: number;
  className?: string;
  onAddContact?: () => void;
  onSendMessage?: () => void;
  onDeleteContacts?: () => void;
  selectedContacts?: Contact[];
  onTagsAdded?: () => void;
  onContactsImported?: () => void;
  compactMode?: boolean;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  selectedCount = 0,
  className = '',
  onAddContact,
  onSendMessage,
  onDeleteContacts,
  selectedContacts = [],
  onTagsAdded,
  onContactsImported,
  compactMode = false
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteContacts) {
      onDeleteContacts();
    }
    setShowDeleteDialog(false);
  };

  const handleTagsAdded = () => {
    if (onTagsAdded) {
      onTagsAdded();
    }
    setShowTagsDialog(false);
  };

  const handleSendMessageClick = () => {
    setShowMessageDialog(true);
    if (onSendMessage) {
      onSendMessage();
    }
  };

  const handleContactsImported = () => {
    if (onContactsImported) {
      onContactsImported();
    }
    toast({
      title: "Import successful",
      description: "Contacts have been imported successfully",
    });
  };

  const handleExportCSV = () => {
    if (!selectedContacts || selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact to export",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Tags', 'Last Activity', 'Created At'];
    
    const rows = selectedContacts.map(contact => [
      getFullName(contact),
      contact.email || '',
      contact.phone || '',
      contact.company || '',
      contact.status,
      (contact.tags || []).join(', '),
      contact.lastActivity ? new Date(contact.lastActivity).toLocaleString() : '',
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

  return (
    <>
      <div className={`flex transition-all duration-300 ease-in-out ${compactMode ? 'flex-shrink-0' : ''} ${className}`}>
        <Button 
          className={`gap-1 mr-2 bg-[#6366F1] hover:bg-[#5855EB] text-white font-medium transition-all duration-300 ${compactMode ? 'w-10 p-0' : ''}`}
          onClick={onAddContact}
        >
          <UserPlus size={16} />
          {!compactMode && "Add Contact"}
        </Button>
        
        <Button 
          variant="outline" 
          className={`gap-1 mr-2 border-gray-300 transition-all duration-300 ${compactMode ? 'w-10 p-0' : ''}`}
          onClick={handleSendMessageClick}
          disabled={selectedCount === 0}
        >
          <Send size={16} />
          {!compactMode && "Send Message"}
        </Button>
        
        <Button 
          variant="outline"
          className={`gap-1 mr-2 border-gray-300 transition-all duration-300 ${compactMode ? 'w-10 p-0' : ''}`}
          onClick={() => setShowTagsDialog(true)}
          disabled={selectedCount === 0}
        >
          <Tag size={16} />
          {!compactMode && "Add Tag"}
        </Button>
        
        <Button 
          variant="outline"
          className={`gap-1 mr-2 border-gray-300 transition-all duration-300 ${compactMode ? 'w-10 p-0' : ''}`}
          onClick={() => setShowImportDialog(true)}
        >
          <Upload size={16} />
          {!compactMode && "Import"}
        </Button>
        
        <Button 
          variant="outline"
          className={`gap-1 mr-2 border-gray-300 transition-all duration-300 ${compactMode ? 'w-10 p-0' : ''}`}
          onClick={handleExportCSV}
          disabled={selectedCount === 0}
        >
          <Download size={16} />
          {!compactMode && "Export"}
        </Button>
        
        <Button 
          variant="destructive"
          className={`gap-1 transition-all duration-300 ${compactMode ? 'w-10 p-0' : ''}`}
          onClick={handleDeleteClick}
          disabled={selectedCount === 0}
        >
          <Trash2 size={16} />
          {!compactMode && "Delete"}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {selectedCount} selected {selectedCount === 1 ? 'contact' : 'contacts'} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showTagsDialog && (
        <AddTagsDialog
          open={showTagsDialog}
          onClose={() => setShowTagsDialog(false)}
          selectedContacts={selectedContacts}
          onTagsAdded={handleTagsAdded}
        />
      )}

      <SendMessageDialog
        open={showMessageDialog}
        onClose={() => setShowMessageDialog(false)}
        selectedContacts={selectedContacts}
      />

      <ImportContactsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportSuccess={handleContactsImported}
      />
    </>
  );
};

export default ActionButtons;
