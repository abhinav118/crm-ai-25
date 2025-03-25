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
import { Info, AlertTriangle, Phone } from 'lucide-react';
import { formatPhoneNumber, isValidPhoneFormat } from './hooks/useImportContacts';

interface VerifyStageProps {
  columns: CsvColumn[];
  data: Record<string, string>[];
}

const VerifyStage: React.FC<VerifyStageProps> = ({ columns, data }) => {
  const mappedColumns = columns.filter(col => col.selected && col.mappedTo);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [invalidPhoneCount, setInvalidPhoneCount] = useState(0);
  
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
        .map(phone => phone.trim())
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
    
    // Track unique combinations
    const uniqueCombinations = new Set<string>();
    
    if (emailColumn || phoneColumn) {
      data.forEach(row => {
        const email = emailColumn ? (row[emailColumn.header] || '').toLowerCase().trim() : '';
        const phone = phoneColumn ? (row[phoneColumn.header] || '').trim() : '';
        
        // Check for invalid phone formats
        if (phone && !isValidPhoneFormat(phone)) {
          invalidPhones++;
        }
        
        // Create a unique key based on email and phone
        const key = `${email}:${phone}`;
        
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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Verify Import Data</h3>
      
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
                        <span className={isValidPhoneFormat(row[column.header]) ? '' : 'text-red-500'}>
                          {isValidPhoneFormat(row[column.header]) 
                            ? formatPhoneNumber(row[column.header]) 
                            : row[column.header] + ' (invalid)'}
                        </span>
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
    </div>
  );
};

export default VerifyStage;
