
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CsvColumn } from './ImportContactsDialog';

interface UploadStageProps {
  onFileSelected: (file: File, columns: CsvColumn[], data: Record<string, string>[]) => void;
}

const UploadStage: React.FC<UploadStageProps> = ({ onFileSelected }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    // Check if it's a CSV file
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    parseCSV(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const parseCSV = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setUploadProgress(100);
        
        // Create column definitions from headers
        const headers = results.meta.fields || [];
        const columns: CsvColumn[] = headers.map(header => ({
          header,
          selected: true,
          mappedTo: null,
          sample: results.data[0]?.[header] || '',
        }));
        
        // Convert data to Record<string, string>[]
        const typedData = results.data as Record<string, string>[];
        
        // Call the callback with the parsed data
        onFileSelected(file, columns, typedData);
        setIsUploading(false);
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
      },
      step: (results, parser) => {
        // Calculate progress based on rows processed
        const totalRows = file.size / 100; // Rough estimate
        const progress = Math.min(90, (results.meta.cursor / totalRows) * 100);
        setUploadProgress(progress);
      },
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-secondary/20' : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <UploadCloud size={48} className="text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">
              {selectedFile ? selectedFile.name : 'Drag and drop a CSV file here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </div>
          <Button type="button" variant="outline">
            Select File
          </Button>
        </div>
      </div>
      
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Uploading {selectedFile?.name}</span>
            <span className="text-sm">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
      
      <div className="text-sm text-muted-foreground">
        <p>Supported format: CSV</p>
        <p>Maximum file size: 10MB</p>
        <p>Ensure your CSV file has headers that can be mapped to contact fields</p>
      </div>
    </div>
  );
};

export default UploadStage;
