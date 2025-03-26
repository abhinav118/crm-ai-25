export type ImportStage = 'upload' | 'map' | 'verify' | 'import';

export interface CsvColumn {
  header: string;
  selected: boolean;
  mappedTo: string | null;
  updateEmptyValues?: boolean;
  sampleValues?: string[]; // Sample values for preview
}

export interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}
