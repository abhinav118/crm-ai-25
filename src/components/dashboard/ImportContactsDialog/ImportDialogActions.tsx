import React from 'react';
import { Button } from '@/components/ui/button';
import { ImportStage } from './types';
import { Loader2 } from 'lucide-react';

interface ImportDialogActionsProps {
  stage: ImportStage;
  isImporting: boolean;
  hasFile: boolean;
  hasSelectedColumns: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

const ImportDialogActions: React.FC<ImportDialogActionsProps> = ({
  stage,
  isImporting,
  hasFile,
  hasSelectedColumns,
  onPrevious,
  onNext,
  onClose,
}) => {
  const getNextButtonText = () => {
    switch (stage) {
      case 'upload':
        return 'Map Fields';
      case 'map':
        return 'Verify Data';
      // case 'verify':
      //   return isImporting ? 'Importing...' : 'Import Contacts';
      default:
        return 'Next';
    }
  };
  
  const getNextButtonDisabled = () => {
    if (isImporting) return true;
    
    switch (stage) {
      case 'upload':
        return !hasFile;
      case 'map':
        return !hasSelectedColumns;
      default:
        return false;
    }
  };
  
  return (
    <div className="flex justify-between mt-6">
      <div>
        {stage !== 'upload' && !isImporting && (
          <Button 
            variant="outline" 
            onClick={onPrevious}
          >
            Back
          </Button>
        )}
      </div>
      
      <div className="flex space-x-2">
        {stage !== 'import' && !isImporting && (
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
        )}
        
        {stage === 'verify' && isImporting ? (
          <Button disabled className="min-w-[150px]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {getNextButtonText()}
          </Button>
        ) : stage !== 'import' ? (
          <Button 
            onClick={onNext}
            disabled={getNextButtonDisabled()}
            className="min-w-[150px]"
          >
            {getNextButtonText()}
          </Button>
        ) : (
          <Button 
            onClick={onClose}
          >
            Close
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImportDialogActions;
