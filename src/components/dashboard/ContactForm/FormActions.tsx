
import React from 'react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  isLoading: boolean;
  onCancel: () => void;
}

const FormActions: React.FC<FormActionsProps> = ({ isLoading, onCancel }) => {
  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Contact'}
      </Button>
    </div>
  );
};

export default FormActions;
