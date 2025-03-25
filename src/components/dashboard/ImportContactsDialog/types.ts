export interface CsvColumn {
  header: string;
  sample: string | null;
  selected: boolean;
  mappedTo: string | null;
  updateEmptyValues?: boolean;
}

export interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

export type ImportStage = 'upload' | 'map' | 'verify' | 'import';
