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
        selected: true,
        mappedTo: null,
        sample,
        updateEmptyValues: false,
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
      
      const lines = content.split('\n').filter(line => line.trim());
      let firstRowMightBeHeaders = true;
      
      if (lines.length >= 2) {
        const firstRow = lines[0].split(delimiter);
        const secondRow = lines[1].split(delimiter);
        
        const firstRowContainsOnlyText = firstRow.every(item => {
          const trimmed = item.trim();
          return trimmed !== '' && isNaN(Number(trimmed));
        });
        
        console.log("First row text only:", firstRowContainsOnlyText);
        
        if (firstRowContainsOnlyText) {
          firstRowMightBeHeaders = true;
        } 
        else {
          const firstRowNumerical = firstRow.every(item => !isNaN(Number(item.trim())));
          const secondRowNumerical = secondRow.every(item => !isNaN(Number(item.trim())));
          
          if (firstRowNumerical && !secondRowNumerical) {
            firstRowMightBeHeaders = false;
          }
        }
      }
      
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
          
          if (results.meta.fields && results.meta.fields.length > 0) {
            csvHeaders = results.meta.fields;
            csvData = results.data as Record<string, string>[];
          } 
          else if (Array.isArray(results.data) && results.data.length > 0) {
            if (Array.isArray(results.data[0])) {
              const data = results.data as unknown as string[][];
              
              if (data[0] && data[0].length > 0) {
                csvHeaders = data[0].map((_, i) => `Column${i + 1}`);
                
                csvData = data.map(row => {
                  const rowObj: Record<string, string> = {};
                  row.forEach((value, index) => {
                    if (index < csvHeaders.length) {
                      rowObj[csvHeaders[index]] = value;
                    }
                  });
                  return rowObj;
                });
              }
            }
            else if (typeof results.data[0] === 'object' && results.data[0] !== null) {
              const firstRow = results.data[0] as Record<string, any>;
              
              try {
                csvHeaders = Object.keys(firstRow);
                csvData = results.data.map((item: any) => {
                  const stringRecord: Record<string, string> = {};
                  for (const key of csvHeaders) {
                    stringRecord[key] = item[key]?.toString() || '';
                  }
                  return stringRecord;
                });
              } catch (e) {
                console.error("Error extracting headers from first row:", e);
                
                csvHeaders = ["Data"];
                csvData = results.data.map((item: any) => ({ 
                  "Data": typeof item === 'string' ? item : JSON.stringify(item) 
                }));
              }
            }
          }
          
          console.log("Raw parsed data structure:", JSON.stringify(results.data).substring(0, 500));
          
          if ((csvHeaders.length === 0 || !csvHeaders) && lines.length > 0) {
            console.log("Using manual parsing as fallback");
            
            const headers = lines[0].split(delimiter).map(h => h.trim() || `Column${h.length + 1}`);
            
            csvHeaders = headers.filter(h => h);
            
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
          
          const validHeaders = csvHeaders.filter(h => h && h.trim() !== '');
          
          if (validHeaders.length === 0) {
            setError('No valid headers found in the CSV file. Please make sure your headers don\'t contain only whitespace.');
            setIsUploading(false);
            return;
          }
          
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
    const headers = 'name,email,phone,company,status,tags\n';
    const row1 = 'John Doe,john@example.com,(555) 123-4567,Acme Inc,active,"lead,website"\n';
    const row2 = 'Jane Smith,jane@example.com,(555) 987-6543,XYZ Corp,active,"customer,referral"';
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

  const handleParseFile = (file: File) => {
    setIsUploading(true);
    setError(null);
    
    if (!file) {
      setError("No file selected");
      setIsUploading(false);
      return;
    }
    
    console.log("Parsing file:", file.name);
    
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
        
        const sampleValues: Record<string, string[]> = {};
        
        if (results.data.length > 0) {
          const fields = results.meta.fields;
          
          fields.forEach(field => {
            sampleValues[field] = [];
          });
          
          const sampleSize = Math.min(5, results.data.length);
          for (let i = 0; i < sampleSize; i++) {
            const row = results.data[i] as Record<string, string>;
            fields.forEach(field => {
              if (row[field] && sampleValues[field].length < 5) {
                sampleValues[field].push(row[field]);
              }
            });
          }
        }
        
        const columns = results.meta.fields.map(header => ({
          header,
          selected: false,
          mappedTo: null,
          updateEmptyValues: false,
          sampleValues: sampleValues[header] || []
        }));
        
        const typedData = results.data as Record<string, string>[];
        onFileSelected(file, columns, typedData);
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
