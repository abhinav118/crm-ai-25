
import React from 'react';
import { Button } from "@/components/ui/button";
import { ImportStage } from './types';

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
  // Set button text based on the current stage
  const getButtonText = () => {
    if (stage === 'verify') {
      return isImporting ? 'Importing...' : 'Import Contacts';
    }
    return 'Next';
  };
  
  // Determine if the next button should be disabled
  const isNextDisabled = () => {
    if (isImporting) return true;
    if (stage === 'upload' && !hasFile) return true;
    if (stage === 'map' && !hasSelectedColumns) return true;
    return false;
  };

  return (
    <div className="flex justify-between mt-4">
      {stage !== 'upload' ? (
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isImporting}
        >
          Back
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isImporting}
        >
          Cancel
        </Button>
      )}
      
      <Button
        onClick={onNext}
        disabled={isNextDisabled()}
        isLoading={isImporting && stage === 'verify'}
      >
        {getButtonText()}
      </Button>
    </div>
  );
};

export default ImportDialogActions;
