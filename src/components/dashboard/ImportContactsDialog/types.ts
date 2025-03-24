
export interface CsvColumn {
  header: string;
  selected: boolean;
  mappedTo: string | null;
  sample?: string;
  updateEmptyValues?: boolean;
}

export type ImportStage = 'upload' | 'map' | 'verify' | 'complete';

export interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}
