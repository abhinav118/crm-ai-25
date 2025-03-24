
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
        disabled={
          (stage === 'upload' && !hasFile) ||
          (stage === 'map' && !hasSelectedColumns) ||
          isImporting
        }
        isLoading={isImporting && stage === 'verify'}
      >
        {getButtonText()}
      </Button>
    </div>
  );
};

export default ImportDialogActions;
