import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UploadStage from './UploadStage';
import MapStage from './MapStage';
import VerifyStage from './VerifyStage';
import ImportBreadcrumbs from './ImportBreadcrumbs';
import type { Database } from "@/integrations/supabase/types";

export interface CsvColumn {
  header: string;
  selected: boolean;
  mappedTo: string | null;
  sample?: string;
  updateEmptyValues?: boolean;
}

export type ImportStage = 'upload' | 'map' | 'verify' | 'complete';

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

const ImportContactsDialog: React.FC<ImportContactsDialogProps> = ({ 
  open, 
  onOpenChange,
  onImportSuccess
}) => {
  const [stage, setStage] = useState<ImportStage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<CsvColumn[]>([]);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const resetState = () => {
    setStage('upload');
    setFile(null);
    setColumns([]);
    setData([]);
    setIsImporting(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const goToNextStage = () => {
    if (stage === 'upload') {
      setStage('map');
    } else if (stage === 'map') {
      setStage('verify');
    } else if (stage === 'verify') {
      importContacts();
    }
  };

  const goToPreviousStage = () => {
    if (stage === 'map') {
      setStage('upload');
    } else if (stage === 'verify') {
      setStage('map');
    }
  };

  const handleFileSelected = (selectedFile: File, parsedColumns: CsvColumn[], parsedData: Record<string, string>[]) => {
    setFile(selectedFile);
    setColumns(parsedColumns);
    setData(parsedData);
  };

  const prepareDataForImport = () => {
    // Get the mapping of CSV headers to database fields
    const headerToFieldMap = columns.reduce((map, column) => {
      if (column.selected && column.mappedTo) {
        map[column.header] = column.mappedTo;
      }
      return map;
    }, {} as Record<string, string>);

    // Transform the data according to the mapping
    return data.map(row => {
      const transformedRow: Record<string, any> = {
        // Ensure name field has a default value if it's not mapped
        name: 'Imported Contact'
      };
      
      // Apply mappings from CSV to database fields
      Object.keys(headerToFieldMap).forEach(header => {
        const fieldName = headerToFieldMap[header];
        const value = row[header];
        
        // Only add non-empty values
        if (value !== undefined && value !== null && value !== '') {
          transformedRow[fieldName] = value;
        }
      });
      
      // Make sure name is always set
      if (!transformedRow.name || transformedRow.name === '') {
        transformedRow.name = 'Imported Contact';
      }
      
      return transformedRow;
    });
  };

  const importContacts = async () => {
    try {
      setIsImporting(true);
      
      // Prepare data for import
      const contactsToImport = prepareDataForImport();
      
      if (contactsToImport.length === 0) {
        toast({
          title: "No data to import",
          description: "Please select at least one column to import",
          variant: "destructive"
        });
        return;
      }
      
      // Type the contacts properly for the database insert
      const typedContacts = contactsToImport.map(contact => {
        return {
          name: contact.name || 'Imported Contact', // Ensure name is always set
          email: contact.email as string | null,
          phone: contact.phone as string | null,
          company: contact.company as string | null,
          status: contact.status as string | null,
          tags: contact.tags as string[] | null
        };
      });
      
      // Insert contacts into the database
      const { error } = await supabase
        .from('contacts')
        .insert(typedContacts);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Import successful",
        description: `Successfully imported ${contactsToImport.length} contacts`,
      });
      
      // Call success callback if provided
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      // Close dialog and reset state
      handleClose();
      
    } catch (error: any) {
      console.error('Error importing contacts:', error);
      toast({
        title: "Import failed",
        description: error.message || "An error occurred while importing contacts",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>
        
        <ImportBreadcrumbs 
          currentStage={stage} 
          onStageSelect={(newStage) => {
            // Only allow going back to previous stages
            if (
              (stage === 'verify' && (newStage === 'map' || newStage === 'upload')) ||
              (stage === 'map' && newStage === 'upload')
            ) {
              setStage(newStage as ImportStage);
            }
          }} 
        />
        
        <div className="py-4">
          {stage === 'upload' && (
            <UploadStage 
              onFileSelected={handleFileSelected} 
            />
          )}
          
          {stage === 'map' && (
            <MapStage 
              columns={columns} 
              setColumns={setColumns} 
            />
          )}
          
          {stage === 'verify' && (
            <VerifyStage 
              columns={columns.filter(col => col.selected)} 
              data={data} 
            />
          )}
        </div>
        
        <div className="flex justify-between mt-4">
          {stage !== 'upload' ? (
            <Button
              variant="outline"
              onClick={goToPreviousStage}
            >
              Back
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
          )}
          
          <Button
            onClick={goToNextStage}
            disabled={
              (stage === 'upload' && !file) ||
              (stage === 'map' && !columns.some(col => col.selected && col.mappedTo)) ||
              isImporting
            }
          >
            {stage === 'verify' ? (isImporting ? 'Importing...' : 'Import Contacts') : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportContactsDialog;
