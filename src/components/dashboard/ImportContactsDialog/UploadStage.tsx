import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileUp, X, FileCheck, DownloadCloud, AlertCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CsvColumn } from './types';
import Papa from 'papaparse';
import { Select, SelectItem } from "@/components/ui/select";

interface UploadStageProps {
  onFileSelected: (file: File, columns: CsvColumn[], data: Record<string, string>[]) => void;
}

const UploadStage: React.FC<UploadStageProps> = ({ onFileSelected }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    
    // Validate file type - more permissive now, accepting any file that could be CSV
    const isCSV = selectedFile.type === 'text/csv' || 
                  selectedFile.name.endsWith('.csv') || 
                  selectedFile.type === 'application/vnd.ms-excel' ||
                  selectedFile.type === 'text/plain';
    
    if (!isCSV) {
      setError('Please select a CSV file. The file should have a .csv extension or be a text file.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }
    
    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const createColumnsAndProceed = (file: File, headers: string[], data: Record<string, string>[]) => {
    // Get the first few rows for sample data
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
        updateEmptyValues: false,
      };
    });
    
    // Call the callback with the parsed data
    onFileSelected(file, columns, data);
    setIsUploading(false);
  };

  const parseCSV = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Read the file as text first
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log("CSV content preview:", content.substring(0, 200) + "...");
      
      // Try to detect delimiter by checking for commas, tabs, and semicolons
      let delimiter = ','; // default
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
      
      // Try to detect if the first row could be headers
      const lines = content.split('\n').filter(line => line.trim());
      let firstRowMightBeHeaders = true;
      
      if (lines.length >= 2) {
        const firstRow = lines[0].split(delimiter);
        const secondRow = lines[1].split(delimiter);
        
        // Check if first row contains only text (not numbers)
        const firstRowContainsOnlyText = firstRow.every(item => {
          const trimmed = item.trim();
          // Check if it's not a number and not empty
          return trimmed !== '' && isNaN(Number(trimmed));
        });
        
        console.log("First row text only:", firstRowContainsOnlyText);
        
        // If first row is all text, it's very likely to be headers
        if (firstRowContainsOnlyText) {
          firstRowMightBeHeaders = true;
        } 
        // If first row is all numbers and second row isn't, first row is likely data
        else {
          const firstRowNumerical = firstRow.every(item => !isNaN(Number(item.trim())));
          const secondRowNumerical = secondRow.every(item => !isNaN(Number(item.trim())));
          
          if (firstRowNumerical && !secondRowNumerical) {
            firstRowMightBeHeaders = false; // First row looks like data, not headers
          }
        }
      }
      
      // Now parse with PapaParse using the string content directly
      Papa.parse(content, {
        header: firstRowMightBeHeaders,
        skipEmptyLines: true,
        delimiter: delimiter,
        transformHeader: header => header.trim(),
        complete: (results) => {
          setUploadProgress(100);
          
          console.log("Parse complete:", results);
          console.log("Detected headers:", results.meta.fields);
          console.log("Data sample:", results.data.slice(0, 3));
          
          // Check for parsing errors
          if (results.errors && results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            
            // Only show error if it's severe enough to prevent import
            if (results.errors.some(e => 
              e.code === "MissingQuotes" || 
              e.code === "UndetectableDelimiter" || 
              e.code === "TooFewFields"
            )) {
              setError(`Error parsing CSV: ${results.errors[0].message}. The file might be using a different format than expected.`);
              setIsUploading(false);
              return;
            }
            // Other errors might be non-critical, so continue
          }
          
          // Add more detailed information to console for debugging
          console.log("Is data an array?", Array.isArray(results.data));
          if (results.data.length > 0) {
            console.log("First row type:", typeof results.data[0]);
            console.log("First row content:", results.data[0]);
          }
          
          let csvHeaders: string[] = [];
          let csvData: Record<string, string>[] = [];
          
          // If headers were detected, use them
          if (results.meta.fields && results.meta.fields.length > 0) {
            csvHeaders = results.meta.fields;
            csvData = results.data as Record<string, string>[];
          } 
          // If no headers were detected but we have data in array format
          else if (Array.isArray(results.data) && results.data.length > 0) {
            // If data is array of arrays, likely no headers were found
            if (Array.isArray(results.data[0])) {
              const data = results.data as unknown as string[][];
              
              // Generate default headers (Column1, Column2, etc.)
              if (data[0] && data[0].length > 0) {
                csvHeaders = data[0].map((_, i) => `Column${i + 1}`);
                
                // Convert to object format - use all rows as data
                csvData = data.map(row => {
                  const rowObj: Record<string, string> = {};
                  row.forEach((value, index) => {
                    // Make sure index is within csvHeaders range
                    if (index < csvHeaders.length) {
                      rowObj[csvHeaders[index]] = value;
                    }
                  });
                  return rowObj;
                });
              }
            }
            // If data is array of objects but no fields were detected
            else if (typeof results.data[0] === 'object' && results.data[0] !== null) {
              const firstRow = results.data[0] as Record<string, any>;
              
              // Try to extract headers from the first object
              try {
                csvHeaders = Object.keys(firstRow);
                csvData = results.data as Record<string, string>[];
              } catch (e) {
                console.error("Error extracting headers from first row:", e);
                
                // Last resort - create a single dummy column
                csvHeaders = ["Data"];
                csvData = results.data.map((item: any) => ({ 
                  "Data": typeof item === 'string' ? item : JSON.stringify(item) 
                }));
              }
            }
          }
          
          // For debugging - dump the raw parsed data
          console.log("Raw parsed data structure:", JSON.stringify(results.data).substring(0, 500));
          
          // Manual parsing as last resort - if PapaParse couldn't parse it properly
          if ((csvHeaders.length === 0 || !csvHeaders) && lines.length > 0) {
            console.log("Using manual parsing as fallback");
            
            // Use the lines we split earlier
            const headers = lines[0].split(delimiter).map(h => h.trim() || `Column${h.length + 1}`);
            
            csvHeaders = headers.filter(h => h);  // Remove empty headers
            
            // Process data rows
            const dataLines = firstRowMightBeHeaders ? lines.slice(1) : lines;
            csvData = dataLines.map(line => {
              const values = line.split(delimiter);
              const row: Record<string, string> = {};
              
              csvHeaders.forEach((header, index) => {
                if (index < values.length) {
                  row[header] = values[index]?.trim() || '';
                } else {
                  row[header] = '';
                }
              });
              
              return row;
            });
          }
          
          // Final validation
          if (!csvHeaders || csvHeaders.length === 0) {
            console.error("No columns found after all parsing attempts");
            setError('No columns found in the CSV file. Please make sure your CSV has headers or contains data in a recognized format.');
            setIsUploading(false);
            return;
          }
          
          if (!csvData || csvData.length === 0) {
            setError('No data found in the CSV file. Please make sure your CSV contains data rows.');
            setIsUploading(false);
            return;
          }
          
          // Filter out any empty headers
          const validHeaders = csvHeaders.filter(h => h && h.trim() !== '');
          
          if (validHeaders.length === 0) {
            setError('No valid headers found in the CSV file. Please make sure your headers don\'t contain only whitespace.');
        setIsUploading(false);
            return;
          }
          
          // If some headers were empty, we need to rebuild the data objects
          if (validHeaders.length !== csvHeaders.length) {
            const newData: Record<string, string>[] = [];
            csvData.forEach(row => {
              const newRow: Record<string, string> = {};
              validHeaders.forEach(header => {
                if (header in row) {
                  newRow[header] = row[header];
                }
              });
              newData.push(newRow);
            });
            csvData = newData;
          }
          
          console.log("Final parsed headers:", validHeaders);
          console.log("Final data sample:", csvData.slice(0, 2));
          
          createColumnsAndProceed(file, validHeaders, csvData);
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
    // Create a sample CSV template
    const headers = 'name,email,phone,company,status,tags\n';
    const row1 = 'John Doe,john@example.com,(555) 123-4567,Acme Inc,active,"lead,website"\n';
    const row2 = 'Jane Smith,jane@example.com,(555) 987-6543,XYZ Corp,active,"customer,referral"';
    const csvContent = headers + row1 + row2;
    
    // Create a blob and download it
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

  const handleParseFile = (file: File) => {
    setIsUploading(true);
    setError(null);
    
    if (!file) {
      setError("No file selected");
      setIsUploading(false);
      return;
    }
    
    console.log("Parsing file:", file.name);
    
    // Parse the CSV file using PapaParse
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Parse complete:", results);
        
        if (results.errors.length > 0) {
          console.error("Parse errors:", results.errors);
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setIsUploading(false);
          return;
        }
        
        if (!results.meta.fields || results.meta.fields.length === 0) {
          setError("No headers found in CSV file");
          setIsUploading(false);
          return;
        }
        
        // For each column, extract a sample of values for preview
        const sampleValues: Record<string, string[]> = {};
        
        if (results.data.length > 0) {
          // Get all field names from the CSV header
          const fields = results.meta.fields;
          
          // Initialize the sample values object
          fields.forEach(field => {
            sampleValues[field] = [];
          });
          
          // Extract up to 5 non-empty sample values for each field
          const sampleSize = Math.min(5, results.data.length);
          for (let i = 0; i < sampleSize; i++) {
            const row = results.data[i];
            fields.forEach(field => {
              if (row[field] && sampleValues[field].length < 5) {
                sampleValues[field].push(row[field]);
              }
            });
          }
        }
        
        // Create column objects from the headers
        const columns = results.meta.fields.map(header => ({
          header,
          selected: false,
          mappedTo: null,
          updateEmptyValues: false,
          sampleValues: sampleValues[header] || []
        }));
        
        onFileSelected(file, columns, results.data);
        setIsUploading(false);
      },
      error: (error) => {
        console.error("Parse error:", error);
        setError(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
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
            First row should contain column headers (e.g., name, email, phone)
          </li>
          <li>
            Required fields: at least one of name, email, or phone
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
