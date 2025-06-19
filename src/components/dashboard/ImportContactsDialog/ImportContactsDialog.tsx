
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useImportContacts } from './hooks/useImportContacts';
import UploadStage from './UploadStage';
import MapStage from './MapStage';
import VerifyStage from './VerifyStage';
import ImportBreadcrumbs from './ImportBreadcrumbs';
import ImportDialogActions from './ImportDialogActions';
import { ImportContactsDialogProps } from './types';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, AlertCircle, Phone, ChevronDown, ChevronUp, Users, Database, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const renderContent = () => {
    if (stage === 'upload') {
      return <UploadStage onFileSelected={handleFileSelected} />;
    }
    
    if (stage === 'map') {
      return <MapStage columns={columns} setColumns={setColumns} />;
    }
    
    if (stage === 'verify') {
      return (
        <VerifyStage 
          columns={columns.filter(col => col.selected)} 
          data={data} 
          selectedColumns={columns.filter(col => col.selected && col.mappedTo)}
          onComplete={() => setStage('import')}
          onBack={goToPreviousStage}
          setImportResult={() => {
            goToNextStage();
          }}
          fileName={file?.name}
        />
      );
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
                Processing contacts with smart merge and upsert logic.
              </p>
            </>
          ) : (
            <>
              {importStats.errors > 0 ? (
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
              ) : (
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              )}
              
              <h3 className="text-xl font-medium">
                {importStats.errors > 0 ? 'Import Completed with Errors' : 'Import Complete!'}
              </h3>
              
              <div className="grid grid-cols-4 gap-4 max-w-3xl mx-auto">
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">Total Processed</p>
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
                <div className="bg-amber-50 p-3 rounded-md">
                  <p className="text-sm text-amber-700">Skipped</p>
                  <p className="text-2xl font-semibold text-amber-700">
                    {importStats.duplicates + importStats.errors + importStats.phoneDuplicatesInFile}
                  </p>
                </div>
              </div>
              
              {/* Enhanced Import Details */}
              <div className="max-w-2xl mx-auto space-y-3">
                <h4 className="font-medium text-gray-700">Import Summary</h4>
                
                {importStats.updated > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-700">Contacts Updated</p>
                    </div>
                    <p className="text-xl font-semibold text-blue-700">{importStats.updated}</p>
                    <p className="text-xs text-blue-600">Existing contacts merged with new data</p>
                  </div>
                )}
                
                {importStats.segmentMerges > 0 && (
                  <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="h-4 w-4 text-purple-600" />
                      <p className="text-sm font-medium text-purple-700">Segment Merges</p>
                    </div>
                    <p className="text-xl font-semibold text-purple-700">{importStats.segmentMerges}</p>
                    <p className="text-xs text-purple-600">Segment names merged without duplicates</p>
                  </div>
                )}
                
                {importStats.duplicates > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-gray-600" />
                      <p className="text-sm font-medium text-gray-700">No Changes Needed</p>
                    </div>
                    <p className="text-xl font-semibold text-gray-700">{importStats.duplicates}</p>
                    <p className="text-xs text-gray-600">Contacts already up-to-date</p>
                  </div>
                )}
                
                {importStats.phoneDuplicatesInFile > 0 && (
                  <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-700">File Duplicates Skipped</p>
                    </div>
                    <p className="text-xl font-semibold text-amber-700">{importStats.phoneDuplicatesInFile}</p>
                    <p className="text-xs text-amber-600">Duplicate phones within uploaded file</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3 mt-4">
                {importStats.errors > 0 && (
                  <div className="max-w-md mx-auto bg-red-50 p-3 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-red-700">Import Errors</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2"
                            onClick={() => setShowErrorDetails(!showErrorDetails)}
                          >
                            {showErrorDetails ? (
                              <ChevronUp className="h-4 w-4 text-red-700" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-red-700" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-red-600">
                          {importStats.errors} rows could not be imported due to errors.
                        </p>
                        
                        {showErrorDetails && (
                          <div className="mt-2 text-left bg-white/50 p-2 rounded">
                            <p className="text-xs font-medium text-red-700 mb-1">Common causes of import errors:</p>
                            <ul className="text-xs text-red-600 list-disc pl-4 space-y-1">
                              <li>Required fields are missing (such as name)</li>
                              <li>Data format issues (especially in dates or numeric fields)</li>
                              <li>Data exceeds maximum field length</li>
                              <li>Database constraint violations</li>
                            </ul>
                            <p className="text-xs text-red-700 mt-2">
                              Check your browser console for detailed error logs.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {importStats.skippedInvalidPhone > 0 && (
                  <div className="max-w-md mx-auto bg-amber-50 p-3 rounded-md">
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-700">Invalid Phone Numbers</p>
                        <p className="text-sm text-amber-600">
                          {importStats.skippedInvalidPhone} rows were skipped because they contained 
                          phone numbers that could not be formatted correctly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                <p className="font-medium">Import Benefits:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-left">
                  <li>Smart merge prevents duplicate contacts</li>
                  <li>Existing contact data preserved and enhanced</li>
                  <li>Segment names automatically merged without duplicates</li>
                  <li>All phone numbers standardized to (XXX) XXX-XXXX format</li>
                  <li>All import actions logged for audit trail</li>
                </ul>
              </div>
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
          <DialogDescription>
            Upload a CSV file to import contacts with enhanced phone number deduplication and segment merging.
          </DialogDescription>
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
