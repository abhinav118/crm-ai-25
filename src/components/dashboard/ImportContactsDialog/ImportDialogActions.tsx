
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
  return (
    <div className="flex justify-between mt-4">
      {stage !== 'upload' ? (
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          Back
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={onClose}
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
      >
        {stage === 'verify' ? (isImporting ? 'Importing...' : 'Import Contacts') : 'Next'}
      </Button>
    </div>
  );
};

export default ImportDialogActions;
