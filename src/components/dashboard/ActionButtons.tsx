
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  UserPlus,
  Send,
  Download,
  Trash2,
  Tag
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

type ActionButtonsProps = {
  selectedCount?: number;
  className?: string;
  onAddContact?: () => void;
  onSendMessage?: () => void;
  onDeleteContacts?: () => void;
  selectedContacts?: Contact[];
  onTagsAdded?: () => void;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  selectedCount = 0,
  className = '',
  onAddContact,
  onSendMessage,
  onDeleteContacts,
  selectedContacts = [],
  onTagsAdded
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

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
    // Still call the parent callback if provided
    if (onSendMessage) {
      onSendMessage();
    }
  };

  return (
    <>
      <div className={`flex ${className}`}>
        <Button 
          className="gap-1 mr-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={onAddContact}
        >
          <UserPlus size={16} />
          Add Contact
        </Button>
        
        <Button 
          variant="outline" 
          className="gap-1 mr-2 border-gray-300"
          onClick={handleSendMessageClick}
          disabled={selectedCount === 0}
        >
          <Send size={16} />
          Send Message
        </Button>
        
        <Button 
          variant="outline"
          className="gap-1 mr-2 border-gray-300"
          onClick={() => setShowTagsDialog(true)}
          disabled={selectedCount === 0}
        >
          <Tag size={16} />
          Add Tag
        </Button>
        
        <Button 
          variant="outline"
          className="gap-1 mr-2 border-gray-300"
          disabled={selectedCount === 0}
        >
          <Download size={16} />
          Export
        </Button>
        
        <Button 
          variant="destructive"
          className="gap-1"
          onClick={handleDeleteClick}
          disabled={selectedCount === 0}
        >
          <Trash2 size={16} />
          Delete
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
    </>
  );
};

export default ActionButtons;
