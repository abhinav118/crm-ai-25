
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { UploadCloud, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CsvColumn } from './types';
import { SAMPLE_CSV_CONTACTS } from '@/data/sampleContacts';

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
    
    // Read the file as text first to debug contents
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log("CSV content preview:", content.substring(0, 200) + "...");
      
      // Now parse with PapaParse
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',', // Explicitly set delimiter
        encoding: 'UTF-8', // Explicitly set encoding
        complete: (results) => {
          setUploadProgress(100);
          
          console.log("Parse complete:", results);
          console.log("Headers:", results.meta.fields);
          console.log("Data sample:", results.data.slice(0, 3));
          
          // Check for parsing errors
          if (results.errors && results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            setError(`Error parsing CSV: ${results.errors[0].message}`);
            setIsUploading(false);
            return;
          }
          
          // Verify we have data and fields
          if (!results.meta.fields || results.meta.fields.length === 0) {
            // Special case: if we have data but no fields, it might be a formatting issue
            if (results.data && results.data.length > 0) {
              // Try to extract headers from the first row
              const firstRow = results.data[0];
              if (firstRow && typeof firstRow === 'object') {
                const extractedHeaders = Object.keys(firstRow);
                if (extractedHeaders.length > 0) {
                  createColumnsAndProceed(file, extractedHeaders, results.data as Record<string, string>[]);
                  return;
                }
              }
            }
            
            setError('No columns found in the CSV file. Please make sure your CSV has headers. Try downloading and using our sample CSV format.');
            setIsUploading(false);
            return;
          }
          
          if (!results.data || results.data.length === 0) {
            setError('No data found in the CSV file. Please make sure your CSV contains data rows.');
            setIsUploading(false);
            return;
          }
          
          // Get the first few rows for better sample data
          const sampleRows = results.data.slice(0, Math.min(5, results.data.length));
          
          // Create column definitions from headers
          const headers = results.meta.fields || [];
          const columns: CsvColumn[] = headers.map(header => {
            // Get non-empty samples across the first few rows
            let sample = '';
            for (const row of sampleRows) {
              const rowData = row as Record<string, string>;
              if (rowData[header] && rowData[header].trim() !== '') {
                sample = rowData[header];
                break;
              }
            }
            
            return {
              header,
              selected: true,
              mappedTo: null,
              sample,
            };
          });
          
          // Convert data to Record<string, string>[]
          const typedData = results.data as Record<string, string>[];
          
          // Call the callback with the parsed data
          onFileSelected(file, columns, typedData);
          setIsUploading(false);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setError(`Error parsing CSV: ${error.message}. Try downloading and using our sample CSV format.`);
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
    
    reader.onerror = () => {
      setError('Error reading the file. Please try again with a different file.');
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };

  // Helper function to create columns and proceed
  const createColumnsAndProceed = (file: File, headers: string[], data: Record<string, string>[]) => {
    // Get the first few rows for better sample data
    const sampleRows = data.slice(0, Math.min(5, data.length));
    
    // Create column definitions from headers
    const columns: CsvColumn[] = headers.map(header => {
      // Get non-empty samples across the first few rows
      let sample = '';
      for (const row of sampleRows) {
        if (row[header] && row[header].trim() !== '') {
          sample = row[header];
          break;
        }
      }
      
      return {
        header,
        selected: true,
        mappedTo: null,
        sample,
      };
    });
    
    // Call the callback with the parsed data
    onFileSelected(file, columns, data);
    setIsUploading(false);
  };

  const downloadSampleCSV = () => {
    // Define the sample headers and data
    const headers = ['name', 'email', 'phone', 'company', 'status', 'tags'];
    
    // Convert to CSV
    const csv = Papa.unparse({
      fields: headers,
      data: SAMPLE_CSV_CONTACTS
    });
    
    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      
      <div className="flex flex-col space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Supported format: CSV</p>
          <p>Maximum file size: 10MB</p>
          <p>Ensure your CSV file has headers that can be mapped to contact fields</p>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full sm:w-auto"
          onClick={downloadSampleCSV}
        >
          <FileDown size={16} />
          Download Sample CSV
        </Button>
      </div>
    </div>
  );
};

export default UploadStage;
