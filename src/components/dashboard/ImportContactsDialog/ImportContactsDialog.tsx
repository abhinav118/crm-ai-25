
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useImportContacts } from './hooks/useImportContacts';
import UploadStage from './UploadStage';
import MapStage from './MapStage';
import VerifyStage from './VerifyStage';
import ImportBreadcrumbs from './ImportBreadcrumbs';
import ImportDialogActions from './ImportDialogActions';
import { ImportContactsDialogProps } from './types';

const ImportContactsDialog: React.FC<ImportContactsDialogProps> = ({ 
  open, 
  onOpenChange,
  onImportSuccess
}) => {
  const {
    stage,
    file,
    columns,
    data,
    isImporting,
    setColumns,
    handleClose,
    goToNextStage,
    goToPreviousStage,
    handleFileSelected,
    setStage,
  } = useImportContacts({ onImportSuccess });

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
              setStage(newStage);
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
        
        <ImportDialogActions 
          stage={stage}
          isImporting={isImporting}
          hasFile={!!file}
          hasSelectedColumns={columns.some(col => col.selected && col.mappedTo)}
          onPrevious={goToPreviousStage}
          onNext={goToNextStage}
          onClose={() => handleClose(onOpenChange)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImportContactsDialog;
