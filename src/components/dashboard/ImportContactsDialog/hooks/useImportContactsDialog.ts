
import { useState } from 'react';
import { ImportStage, CsvColumn } from '../types';
import Papa from 'papaparse';
import { useImportContacts } from './useImportContacts';

interface UseImportContactsDialogProps {
  onImportSuccess?: () => void;
}

export const useImportContactsDialog = ({ onImportSuccess }: UseImportContactsDialogProps) => {
  const [stage, setStage] = useState<ImportStage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<CsvColumn[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [segmentName, setSegmentName] = useState<string>('');
  
  const {
    isImporting,
    importProgress,
    importResults,
    importContacts,
    resetState
  } = useImportContacts();

  // Calculate import stats from results
  const importStats = {
    total: importResults.length,
    created: importResults.filter(r => r.success && r.contact).length,
    updated: 0, // This would need to be tracked separately in a real implementation
    errors: importResults.filter(r => !r.success).length,
    duplicates: 0, // This would need to be tracked separately
    segmentMerges: 0, // This would need to be tracked separately
    phoneDuplicatesInFile: 0, // This would need to be tracked separately
    skippedInvalidPhone: 0 // This would need to be tracked separately
  };

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    
    // Parse CSV to extract columns and sample data
    Papa.parse(selectedFile, {
      header: true,
      preview: 5,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const sampleData = results.data as any[];
        
        const csvColumns: CsvColumn[] = headers.map(header => ({
          name: header,
          header: header,
          selected: false,
          mappedTo: null,
          updateEmptyValues: false,
          sampleValues: sampleData.map(row => row[header]).filter(Boolean).slice(0, 3)
        }));
        
        setColumns(csvColumns);
        setData(sampleData);
      }
    });
  };

  const goToNextStage = () => {
    if (stage === 'upload') setStage('map');
    else if (stage === 'map') setStage('verify');
    else if (stage === 'verify') setStage('import');
  };

  const goToPreviousStage = () => {
    if (stage === 'map') setStage('upload');
    else if (stage === 'verify') setStage('map');
    else if (stage === 'import') setStage('verify');
  };

  const handleClose = (onOpenChange: (open: boolean) => void) => {
    resetState();
    setStage('upload');
    setFile(null);
    setColumns([]);
    setData([]);
    setSegmentName('');
    onOpenChange(false);
  };

  return {
    stage,
    file,
    columns,
    data,
    isImporting,
    importProgress,
    importStats,
    importResults,
    setColumns,
    handleClose,
    goToNextStage,
    goToPreviousStage,
    handleFileSelected,
    setStage,
    setSegmentName,
    importContacts,
    resetState
  };
};
