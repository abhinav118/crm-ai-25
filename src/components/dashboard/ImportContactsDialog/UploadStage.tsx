import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileUp, X, FileCheck, DownloadCloud, AlertCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CsvColumn } from './types';
import Papa from 'papaparse';

interface UploadStageProps {
  onFileSelected: (file: File, columns: CsvColumn[], data: Record<string, string>[]) => void;
}

const UploadStage: React.FC<UploadStageProps> = ({ onFileSelected }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [enableNameSplitting, setEnableNameSplitting] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    
    const isCSV = selectedFile.type === 'text/csv' || 
                  selectedFile.name.endsWith('.csv') || 
                  selectedFile.type === 'application/vnd.ms-excel' ||
                  selectedFile.type === 'text/plain';
    
    if (!isCSV) {
      setError('Please select a CSV file. The file should have a .csv extension or be a text file.');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }
    
    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const createColumnsAndProceed = (file: File, headers: string[], data: Record<string, string>[]) => {
    const sampleRows = data.slice(0, Math.min(5, data.length));
        
    const columns: CsvColumn[] = headers.map(header => {
      let sample = '';
      for (const row of sampleRows) {
        if (row[header] && row[header].trim() !== '') {
          sample = row[header];
          break;
        }
      }
      
      return {
        header,
        name: header,
        selected: true,
        mappedTo: null,
        updateEmptyValues: false,
        sampleValues: [sample]
      };
    });
    
    onFileSelected(file, columns, data);
    setIsUploading(false);
  };

  const parseCSV = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log("CSV content preview:", content.substring(0, 200) + "...");
      
      // Auto-detect delimiter
      let delimiter = ',';
      const firstLines = content.split('\n').slice(0, 3).join('\n');
      const commaCount = (firstLines.match(/,/g) || []).length;
      const tabCount = (firstLines.match(/\t/g) || []).length;
      const semicolonCount = (firstLines.match(/;/g) || []).length;

      if (tabCount > commaCount && tabCount > semicolonCount) {
        delimiter = '\t';
      } else if (semicolonCount > commaCount && semicolonCount > tabCount) {
        delimiter = ';';
      }
      
      console.log(`Detected delimiter: ${delimiter === '\t' ? 'tab' : delimiter}`);
      console.log(`User specified headers: ${hasHeaders}`);
      
      Papa.parse(content, {
        header: hasHeaders,
        skipEmptyLines: true,
        delimiter: delimiter,
        transformHeader: header => header.trim(),
        complete: (results) => {
          setUploadProgress(100);
          
          console.log("Parse complete:", results);
          console.log("Detected headers:", results.meta.fields);
          console.log("Data sample:", results.data.slice(0, 3));
          
          if (results.errors && results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            
            if (results.errors.some(e => 
              e.code === "MissingQuotes" || 
              e.code === "UndetectableDelimiter" || 
              e.code === "TooFewFields"
            )) {
              setError(`Error parsing CSV: ${results.errors[0].message}. The file might be using a different format than expected.`);
              setIsUploading(false);
              return;
            }
          }
          
          let csvHeaders: string[] = [];
          let csvData: Record<string, string>[] = [];
          
          if (hasHeaders && results.meta.fields && results.meta.fields.length > 0) {
            // CSV has headers
            csvHeaders = results.meta.fields;
            csvData = results.data as Record<string, string>[];
          } else if (!hasHeaders && Array.isArray(results.data) && results.data.length > 0) {
            // CSV has no headers - create generic column names
            const firstRow = results.data[0] as string[];
            if (Array.isArray(firstRow)) {
              csvHeaders = firstRow.map((_, i) => `Column${i + 1}`);
              
              // Convert all rows to objects with generic column names
              csvData = (results.data as string[][]).map(row => {
                const rowObj: Record<string, string> = {};
                row.forEach((value, index) => {
                  if (index < csvHeaders.length) {
                    rowObj[csvHeaders[index]] = value || '';
                  }
                });
                return rowObj;
              });
            }
          } else if (hasHeaders && typeof results.data[0] === 'object' && results.data[0] !== null) {
            // Fallback for object-based parsing
            const firstRow = results.data[0] as Record<string, any>;
            csvHeaders = Object.keys(firstRow);
            csvData = results.data.map((item: any) => {
              const stringRecord: Record<string, string> = {};
              for (const key of csvHeaders) {
                stringRecord[key] = item[key]?.toString() || '';
              }
              return stringRecord;
            });
          }
          
          if (!csvHeaders || csvHeaders.length === 0) {
            setError('No columns found in the CSV file. Please make sure your CSV contains data.');
            setIsUploading(false);
            return;
          }
          
          if (!csvData || csvData.length === 0) {
            setError('No data found in the CSV file. Please make sure your CSV contains data rows.');
            setIsUploading(false);
            return;
          }
          
          // Apply name splitting if enabled and appropriate
          if (enableNameSplitting) {
            csvData = csvData.map(row => {
              const processedRow = { ...row };
              
              // Look for full name patterns in any column
              Object.keys(processedRow).forEach(key => {
                const value = processedRow[key];
                if (value && typeof value === 'string' && value.includes(' ')) {
                  // Check if this looks like a full name (has space and no other obvious data)
                  const parts = value.trim().split(/\s+/);
                  if (parts.length >= 2 && parts.every(part => /^[A-Za-z'-]+$/.test(part))) {
                    // This looks like a full name, split it
                    processedRow[`${key}_first`] = parts[0];
                    processedRow[`${key}_last`] = parts.slice(1).join(' ');
                    console.log(`Split "${value}" into first: "${parts[0]}" and last: "${parts.slice(1).join(' ')}"`);
                  }
                }
              });
              
              return processedRow;
            });
            
            // Update headers to include split names
            const additionalHeaders: string[] = [];
            csvHeaders.forEach(header => {
              const sampleValue = csvData[0]?.[header];
              if (sampleValue && typeof sampleValue === 'string' && sampleValue.includes(' ')) {
                const parts = sampleValue.trim().split(/\s+/);
                if (parts.length >= 2 && parts.every(part => /^[A-Za-z'-]+$/.test(part))) {
                  additionalHeaders.push(`${header}_first`, `${header}_last`);
                }
              }
            });
            csvHeaders = [...csvHeaders, ...additionalHeaders];
          }
          
          console.log("Final parsed headers:", csvHeaders);
          console.log("Final data sample:", csvData.slice(0, 2));
          console.log(`Total contacts to import: ${csvData.length}`);
          
          createColumnsAndProceed(file, csvHeaders, csvData);
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setError(`Error parsing CSV: ${error.message}. Try downloading and using our sample CSV format.`);
          setIsUploading(false);
        },
      });
    };
    
    reader.onerror = () => {
      setError('Error reading the file. Please try again with a different file.');
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const headers = 'first_name,last_name,email,phone,company,status,tags\n';
    const row1 = 'John,Doe,john@example.com,(555) 123-4567,Acme Inc,active,"lead,website"\n';
    const row2 = 'Jane,Smith,jane@example.com,(555) 987-6543,XYZ Corp,active,"customer,referral"';
    const csvContent = headers + row1 + row2;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Upload Contact Data</h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        Upload a CSV file containing your contacts. You can download a template to see the expected format.
      </p>
      
      <div className="flex justify-end mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center text-xs"
          onClick={handleDownloadTemplate}
        >
          <DownloadCloud size={14} className="mr-1" />
          Download Template
        </Button>
      </div>

      {/* CSV Import Options */}
      <div className="bg-muted/40 p-4 rounded-md space-y-3">
        <h4 className="text-sm font-medium">Import Options</h4>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hasHeaders" 
            checked={hasHeaders} 
            onCheckedChange={(checked) => setHasHeaders(checked as boolean)}
          />
          <label htmlFor="hasHeaders" className="text-sm">
            My CSV file has headers in the first row
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="enableNameSplitting" 
            checked={enableNameSplitting} 
            onCheckedChange={(checked) => setEnableNameSplitting(checked as boolean)}
          />
          <label htmlFor="enableNameSplitting" className="text-sm">
            Automatically split full names into first and last names
          </label>
        </div>
        
        {!hasHeaders && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <strong>No headers mode:</strong> The first row will be treated as contact data. 
            Columns will be named Column1, Column2, etc.
          </div>
        )}
        
        {enableNameSplitting && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            <strong>Name splitting enabled:</strong> Full names like "David Clark" will be automatically 
            split into separate first and last name fields.
          </div>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isUploading ? (
        <div className="space-y-4 p-8 border rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  Processing CSV...
                </p>
              </div>
            </div>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress < 100 ? 'Parsing file...' : 'Preparing data...'}
          </p>
        </div>
      ) : !file ? (
        <>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-3 rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">
                  Drag and drop your CSV file here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse files
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp size={14} className="mr-1" />
                Browse files
              </Button>
            </div>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv, text/csv, application/vnd.ms-excel, text/plain"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB • CSV
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="bg-muted/40 p-4 rounded-md mt-4">
        <h4 className="text-sm font-medium mb-2">CSV File Requirements</h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          <li>
            File must be in CSV format (comma, tab, or semicolon separated values)
          </li>
          <li>
            Headers are optional - you can import data-only CSV files
          </li>
          <li>
            Required fields: at least one of name, email, or phone
          </li>
          <li>
            Full names will be automatically split if name splitting is enabled
          </li>
          <li>
            For tags, separate multiple values with commas inside quotes (e.g., "tag1,tag2")
          </li>
          <li>
            Status should be either 'active' or 'inactive'
          </li>
          <li>
            File size should be under 5MB
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UploadStage;
