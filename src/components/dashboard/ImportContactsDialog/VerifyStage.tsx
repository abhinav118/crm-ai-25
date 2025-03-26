import React, { useEffect, useState } from 'react';
import { CsvColumn } from './types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, AlertTriangle, Phone, CheckCircle2, FileText } from 'lucide-react';
import { formatPhoneNumber, isValidPhoneFormat } from './hooks/useImportContacts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface VerifyStageProps {
  columns: CsvColumn[];
  data: Record<string, string>[];
  selectedColumns: CsvColumn[];
  onComplete: () => void;
  onBack: () => void;
  setImportResult: (result: string) => void;
  fileName?: string;
}

const VerifyStage: React.FC<VerifyStageProps> = ({
  columns,
  data,
  selectedColumns,
  onComplete,
  onBack,
  setImportResult,
  fileName
}) => {
  const mappedColumns = columns.filter(col => col.selected && col.mappedTo);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [invalidPhoneCount, setInvalidPhoneCount] = useState(0);
  const [validPhoneCount, setValidPhoneCount] = useState(0);
  const [batchId] = useState<string>(crypto.randomUUID());
  const [batchName] = useState<string>(fileName || `Imported contacts ${new Date().toLocaleString()}`);
  const [isImporting, setIsImporting] = useState(false);
  
  // Count unique values for matching
  const countUniqueEmails = () => {
    const emailColumn = columns.find(col => col.mappedTo === 'email');
    if (!emailColumn) return 0;
    
    const uniqueEmails = new Set(
      data
        .map(row => row[emailColumn.header])
        .filter(Boolean)
        .map(email => email.trim().toLowerCase())
    );
    
    return uniqueEmails.size;
  };
  
  const countUniquePhones = () => {
    const phoneColumn = columns.find(col => col.mappedTo === 'phone');
    if (!phoneColumn) return 0;
    
    const uniquePhones = new Set(
      data
        .map(row => row[phoneColumn.header])
        .filter(Boolean)
        .map(phone => formatPhoneNumber(phone.trim())) // Use formatted phones for counting
        .filter(phone => isValidPhoneFormat(phone)) // Only count valid phones
    );
    
    return uniquePhones.size;
  };

  // Count missing required values
  const countMissingValues = () => {
    // Name is the only required field
    const nameColumn = columns.find(col => col.mappedTo === 'name');
    if (!nameColumn) return data.length; // If no name column, all are missing
    
    return data.filter(row => !row[nameColumn.header]).length;
  };

  // Detect duplicates and invalid phones
  useEffect(() => {
    const emailColumn = columns.find(col => col.mappedTo === 'email');
    const phoneColumn = columns.find(col => col.mappedTo === 'phone');
    
    // Reset counters
    let duplicates = 0;
    let invalidPhones = 0;
    let validPhones = 0;
    
    // Track unique combinations
    const uniqueCombinations = new Set<string>();
    
    if (emailColumn || phoneColumn) {
      data.forEach(row => {
        const email = emailColumn ? (row[emailColumn.header] || '').toLowerCase().trim() : '';
        const phone = phoneColumn ? (row[phoneColumn.header] || '').trim() : '';
        
        // Check for phone formats
        if (phone) {
          if (isValidPhoneFormat(phone)) {
            validPhones++;
          } else {
            invalidPhones++;
          }
        }
        
        // Create a unique key based on email and phone
        const formattedPhone = phone ? formatPhoneNumber(phone) : '';
        const key = `${email}:${formattedPhone}`;
        
        // Skip rows where both email and phone are empty
        if (!email && !phone) return;
        
        // If this combination has been seen before, it's a duplicate
        if (uniqueCombinations.has(key)) {
          duplicates++;
        } else {
          uniqueCombinations.add(key);
        }
      });
      
      setDuplicateCount(duplicates);
      setInvalidPhoneCount(invalidPhones);
      setValidPhoneCount(validPhones);
    }
  }, [columns, data]);

  // Get formatted phone examples
  const getPhoneExamples = () => {
    const phoneColumn = columns.find(col => col.mappedTo === 'phone');
    if (!phoneColumn) return [];
    
    // Find a few different phone formats in the data
    const phoneFormats = new Map<string, string>();
    
    data.forEach(row => {
      const phone = row[phoneColumn.header];
      if (phone && !isValidPhoneFormat(phone) && phoneFormats.size < 3) {
        const formatted = formatPhoneNumber(phone);
        if (formatted !== phone) {
          phoneFormats.set(phone, formatted);
        }
      }
    });
    
    return Array.from(phoneFormats.entries());
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Call the provided setImportResult function to trigger the import
      // The actual import logic is in the useImportContacts hook
      // which now includes the contact_logs functionality
      setImportResult("Import started");
      onComplete();
    } catch (error) {
      console.error("Error starting import:", error);
      setImportResult("Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Verify Your Data</h2>
        <p className="text-muted-foreground">
          Review the data before importing. We'll import only unique contacts with valid information.
        </p>
      </div>
      
      {/* Batch information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-700">Import Batch Details</h3>
              <div className="mt-2 space-y-1 text-sm text-blue-700">
                <p><strong>Batch ID:</strong> {batchId.substring(0, 8)}...</p>
                <p><strong>Batch Name:</strong> {batchName}</p>
                <p><strong>Created At:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Unique Records:</strong> {data.length - duplicateCount} (out of {data.length} total)</p>
              </div>
              <p className="mt-2 text-xs text-blue-600">
                These details will be saved in the contact_logs table for tracking purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Ready to Import</AlertTitle>
        <AlertDescription>
          Review the data below before proceeding with the import. This will import {data.length - duplicateCount - invalidPhoneCount} unique contacts.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-muted/30 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">Total Rows</p>
          <p className="text-2xl font-semibold">{data.length}</p>
        </div>
        
        <div className="bg-muted/30 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">Unique Emails</p>
          <p className="text-2xl font-semibold">{countUniqueEmails()}</p>
        </div>
        
        <div className="bg-muted/30 p-3 rounded-md">
          <p className="text-sm text-muted-foreground">Unique Phones</p>
          <p className="text-2xl font-semibold">{countUniquePhones()}</p>
        </div>
        
        <div className={`${(duplicateCount > 0 || invalidPhoneCount > 0) ? 'bg-amber-50' : 'bg-green-50'} p-3 rounded-md`}>
          <p className={`text-sm ${(duplicateCount > 0 || invalidPhoneCount > 0) ? 'text-amber-700' : 'text-green-700'}`}>
            Will Skip
          </p>
          <p className={`text-2xl font-semibold ${(duplicateCount > 0 || invalidPhoneCount > 0) ? 'text-amber-700' : 'text-green-700'}`}>
            {duplicateCount + invalidPhoneCount}
          </p>
        </div>
      </div>
      
      {validPhoneCount > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">Phone Number Formatting</AlertTitle>
          <AlertDescription className="text-green-700">
            {validPhoneCount} phone numbers will be standardized to (XXX) XXX-XXXX format during import.
          </AlertDescription>
        </Alert>
      )}
      
      {duplicateCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Duplicate Detection</AlertTitle>
          <AlertDescription>
            {duplicateCount} duplicate rows with the same email and phone combination were detected. 
            Only the first occurrence of each unique combination will be imported.
          </AlertDescription>
        </Alert>
      )}
      
      {invalidPhoneCount > 0 && (
        <Alert>
          <Phone className="h-4 w-4" />
          <AlertTitle>Invalid Phone Numbers</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {invalidPhoneCount} rows contain phone numbers that cannot be formatted to the standard (XXX) XXX-XXXX format.
              These rows will be skipped during import.
            </p>
            {getPhoneExamples().length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Examples:</p>
                <ul className="text-sm mt-1 space-y-1">
                  {getPhoneExamples().map(([original, formatted], index) => (
                    <li key={index}>
                      <span className="line-through">{original}</span> → <span className="font-medium">{formatted}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {countMissingValues() > 0 && (
        <Alert>
          <AlertTitle>Missing Required Values</AlertTitle>
          <AlertDescription>
            {countMissingValues()} records are missing a name. These contacts may be imported with blank names.
          </AlertDescription>
        </Alert>
      )}
      
      <div>
        <h4 className="text-sm font-medium mb-2">Data Preview (first 5 rows)</h4>
        
        <ScrollArea className="h-[300px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {mappedColumns.map((column, index) => (
                  <TableHead key={index}>
                    {column.header}
                    <div className="text-xs text-muted-foreground">
                      {column.mappedTo}
                      {column.mappedTo === 'phone' && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          Will Format
                        </Badge>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 5).map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {mappedColumns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.mappedTo === 'phone' && row[column.header] ? (
                        <div>
                          <span className={isValidPhoneFormat(row[column.header]) ? 'text-green-600' : 'text-red-500'}>
                            {isValidPhoneFormat(row[column.header]) 
                              ? formatPhoneNumber(row[column.header]) 
                              : row[column.header] + ' (invalid)'}
                          </span>
                          {!isValidPhoneFormat(row[column.header]) && (
                            <div className="text-xs text-red-500 mt-1">Will be skipped</div>
                          )}
                        </div>
                      ) : (
                        row[column.header] || '—'
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      
      {/* Import button section */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={isImporting}
          className="min-w-[120px]"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>Import {data.length - duplicateCount} Contacts</>
          )}
        </Button>
      </div>
      
      {/* Explanation of logging */}
      <div className="pt-4 text-sm text-muted-foreground border-t">
        <p className="font-medium">What happens when you import:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Each contact will be created or updated in the contacts table</li>
          <li>A log entry will be created in the contact_logs table for each contact</li>
          <li>All contacts in this import will share the same batch ID and name</li>
          <li>You can track this import batch in the Bulk Actions tab</li>
        </ul>
      </div>
    </div>
  );
};

export default VerifyStage;
