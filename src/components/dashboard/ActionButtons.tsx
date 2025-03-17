
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

  return (
    <>
      <div className={`space-x-2 flex ${className}`}>
        <Button 
          size="sm" 
          className="gap-1"
          onClick={onAddContact}
        >
          <UserPlus size={16} />
          Add Contact
        </Button>
        
        {selectedCount > 0 && (
          <>
            <Button 
              size="sm"
              variant="outline" 
              className="gap-1"
              onClick={onSendMessage}
            >
              <Send size={16} />
              Send Message
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1"
              onClick={() => setShowTagsDialog(true)}
            >
              <Tag size={16} />
              Add Tag
            </Button>
            
            <Button 
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <Download size={16} />
              Export
            </Button>
            
            <Button 
              size="sm"
              variant="destructive"
              className="gap-1"
              onClick={handleDeleteClick}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </>
        )}
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
    </>
  );
};

export default ActionButtons;
