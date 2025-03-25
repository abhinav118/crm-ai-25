import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useImportContacts } from './hooks/useImportContacts';
import UploadStage from './UploadStage';
import MapStage from './MapStage';
import VerifyStage from './VerifyStage';
import ImportBreadcrumbs from './ImportBreadcrumbs';
import ImportDialogActions from './ImportDialogActions';
import { ImportContactsDialogProps } from './types';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2 } from 'lucide-react';

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
    importProgress,
    importStats,
    setColumns,
    handleClose,
    goToNextStage,
    goToPreviousStage,
    handleFileSelected,
    setStage,
  } = useImportContacts({ onImportSuccess });

  const renderContent = () => {
    if (stage === 'upload') {
      return <UploadStage onFileSelected={handleFileSelected} />;
    }
    
    if (stage === 'map') {
      return <MapStage columns={columns} setColumns={setColumns} />;
    }
    
    if (stage === 'verify') {
      return <VerifyStage columns={columns.filter(col => col.selected)} data={data} />;
    }
    
    if (stage === 'import') {
      return (
        <div className="py-12 text-center space-y-6">
          {importProgress < 100 ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <h3 className="text-xl font-medium">Importing Contacts...</h3>
              <Progress value={importProgress} className="w-full h-2" />
              <p className="text-sm text-muted-foreground">
                Please wait while your contacts are being imported.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-xl font-medium">Import Complete!</h3>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-semibold">{importStats.total}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-green-700">Created</p>
                  <p className="text-2xl font-semibold text-green-700">{importStats.created}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">Updated</p>
                  <p className="text-2xl font-semibold text-blue-700">{importStats.updated}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your contacts have been successfully imported.
              </p>
            </>
          )}
        </div>
      );
    }
    
    return null;
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
              setStage(newStage);
            }
          }} 
        />
        
        <div className="py-4">
          {renderContent()}
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
