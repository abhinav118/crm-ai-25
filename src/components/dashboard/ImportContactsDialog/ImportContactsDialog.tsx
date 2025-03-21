
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ImportBreadcrumbs from './ImportBreadcrumbs';
import UploadStage from './UploadStage';
import MapStage from './MapStage';
import VerifyStage from './VerifyStage';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type ImportStage = 'upload' | 'map' | 'verify';
export type ImportMode = 'create' | 'update' | 'both';

export interface CsvColumn {
  header: string;
  sample: string[];
  mappedTo: string | null;
  selected: boolean;
  updateEmptyValues: boolean;
}

interface ImportContactsDialogProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

const ImportContactsDialog: React.FC<ImportContactsDialogProps> = ({ 
  open, 
  onClose,
  onImportSuccess 
}) => {
  const [stage, setStage] = useState<ImportStage>('upload');
  const [importMode, setImportMode] = useState<ImportMode>('both');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<CsvColumn[]>([]);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [importReady, setImportReady] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dontImportUnmapped, setDontImportUnmapped] = useState(true);
  const { toast } = useToast();

  const handleFileUpload = (uploadedFile: File, data: Record<string, string>[], extractedColumns: CsvColumn[]) => {
    setFile(uploadedFile);
    setParsedData(data);
    setColumns(extractedColumns);
    setStage('map');
  };

  const handleImportModeChange = (mode: ImportMode) => {
    setImportMode(mode);
  };

  const handleColumnMapping = (updatedColumns: CsvColumn[]) => {
    setColumns(updatedColumns);
    
    // Check if at least one column is mapped and selected
    const hasSelectedMappings = updatedColumns.some(col => col.selected && col.mappedTo);
    setImportReady(hasSelectedMappings);
  };

  const handleGoBack = () => {
    if (stage === 'map') setStage('upload');
    if (stage === 'verify') setStage('map');
  };

  const handleNext = () => {
    if (stage === 'map') setStage('verify');
  };

  const handleImport = async () => {
    if (!importReady || !parsedData.length) return;
    
    setIsImporting(true);
    
    try {
      // Filter to only selected columns
      const selectedColumns = columns.filter(col => col.selected && col.mappedTo);
      
      // Prepare contacts for import
      const contactsToImport = parsedData.map(row => {
        const contact: Record<string, any> = {};
        
        selectedColumns.forEach(col => {
          if (col.mappedTo && (!col.updateEmptyValues && !row[col.header])) {
            // Skip empty values if updateEmptyValues is false
            return;
          }
          
          // Convert to tags array if tags field
          if (col.mappedTo === 'tags' && row[col.header]) {
            contact[col.mappedTo] = row[col.header].split(',').map(tag => tag.trim());
          } else {
            contact[col.mappedTo] = row[col.header] || null;
          }
        });
        
        // Ensure name is present (required field)
        if (!contact.name) {
          contact.name = 'Imported Contact';
        }
        
        // Set default status if not provided
        if (!contact.status) {
          contact.status = 'active';
        }
        
        return contact;
      });
      
      if (contactsToImport.length === 0) {
        throw new Error('No valid contacts to import');
      }
      
      console.log('Importing contacts:', contactsToImport);
      
      // Insert into database
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactsToImport)
        .select();
      
      if (error) throw error;
      
      console.log('Import success:', data);
      
      toast({
        title: 'Import successful',
        description: `${data.length} contacts have been imported.`,
      });
      
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Use Dialog for desktop and Sheet for mobile
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Import Contacts</DialogTitle>
          </DialogHeader>
          
          <div className="py-2">
            <ImportBreadcrumbs currentStage={stage} />
            
            {stage === 'upload' && (
              <UploadStage 
                onFileUpload={handleFileUpload} 
                importMode={importMode}
                onImportModeChange={handleImportModeChange}
              />
            )}
            
            {stage === 'map' && (
              <MapStage 
                columns={columns}
                onColumnsChange={handleColumnMapping}
                dontImportUnmapped={dontImportUnmapped}
                onDontImportUnmappedChange={setDontImportUnmapped}
              />
            )}
            
            {stage === 'verify' && (
              <VerifyStage 
                columns={columns.filter(col => col.selected && col.mappedTo)}
                data={parsedData}
              />
            )}
            
            <div className="flex justify-between mt-6">
              {stage !== 'upload' ? (
                <Button variant="outline" onClick={handleGoBack}>
                  Back
                </Button>
              ) : (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
              
              <div className="space-x-2">
                {stage === 'map' && (
                  <Button 
                    onClick={handleNext} 
                    disabled={!importReady}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Next
                  </Button>
                )}
                
                {stage === 'verify' && (
                  <Button 
                    onClick={handleImport} 
                    disabled={!importReady || isImporting}
                    isLoading={isImporting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Import
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Mobile view */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-full md:hidden">
          <div className="h-full flex flex-col">
            <div className="py-6">
              <h2 className="text-xl font-semibold">Import Contacts</h2>
            </div>
            
            <div className="flex-1 overflow-auto py-2">
              <ImportBreadcrumbs currentStage={stage} />
              
              {stage === 'upload' && (
                <UploadStage 
                  onFileUpload={handleFileUpload} 
                  importMode={importMode}
                  onImportModeChange={handleImportModeChange}
                />
              )}
              
              {stage === 'map' && (
                <MapStage 
                  columns={columns}
                  onColumnsChange={handleColumnMapping}
                  dontImportUnmapped={dontImportUnmapped}
                  onDontImportUnmappedChange={setDontImportUnmapped}
                />
              )}
              
              {stage === 'verify' && (
                <VerifyStage 
                  columns={columns.filter(col => col.selected && col.mappedTo)}
                  data={parsedData}
                />
              )}
            </div>
            
            <div className="py-4 border-t flex justify-between mt-auto">
              {stage !== 'upload' ? (
                <Button variant="outline" onClick={handleGoBack}>
                  Back
                </Button>
              ) : (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
              
              <div className="space-x-2">
                {stage === 'map' && (
                  <Button 
                    onClick={handleNext} 
                    disabled={!importReady}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Next
                  </Button>
                )}
                
                {stage === 'verify' && (
                  <Button 
                    onClick={handleImport} 
                    disabled={!importReady || isImporting}
                    isLoading={isImporting}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Import
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ImportContactsDialog;
