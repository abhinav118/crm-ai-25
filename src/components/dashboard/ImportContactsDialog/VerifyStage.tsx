
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
import { Info, AlertTriangle, Phone, CheckCircle2, FileText, Users } from 'lucide-react';
import { formatPhoneNumber, isValidPhoneFormat, normalizePhoneNumber } from './hooks/useImportContacts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [phoneDuplicatesInFile, setPhoneDuplicatesInFile] = useState(0);
  const [phoneDuplicatesInDb, setPhoneDuplicatesInDb] = useState(0);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
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
    // Check for first_name or last_name
    const firstNameColumn = columns.find(col => col.mappedTo === 'first_name');
    const lastNameColumn = columns.find(col => col.mappedTo === 'last_name');
    
    if (!firstNameColumn && !lastNameColumn) return data.length; // If no name columns, all are missing
    
    return data.filter(row => {
      const firstName = firstNameColumn ? row[firstNameColumn.header] : '';
      const lastName = lastNameColumn ? row[lastNameColumn.header] : '';
      return !firstName && !lastName;
    }).length;
  };

  // Enhanced phone duplicate detection
  useEffect(() => {
    const checkPhoneDuplicates = async () => {
      setIsCheckingDuplicates(true);
      
      const phoneColumn = columns.find(col => col.mappedTo === 'phone');
      
      // Reset counters
      let invalidPhones = 0;
      let validPhones = 0;
      let fileDuplicates = 0;
      let dbDuplicates = 0;
      
      if (phoneColumn) {
        // Check duplicates within the file
        const phoneMap = new Map<string, number>();
        
        data.forEach(row => {
          const phone = row[phoneColumn.header];
          
          if (phone) {
            if (isValidPhoneFormat(phone)) {
              validPhones++;
              const normalizedPhone = normalizePhoneNumber(phone);
              
              if (phoneMap.has(normalizedPhone)) {
                fileDuplicates++;
              } else {
                phoneMap.set(normalizedPhone, 1);
              }
            } else {
              invalidPhones++;
            }
          }
        });
        
        // Check against existing database
        const uniquePhones = Array.from(phoneMap.keys());
        
        if (uniquePhones.length > 0) {
          try {
            const { data: existingContacts, error } = await supabase
              .from('contacts')
              .select('phone')
              .not('phone', 'is', null);
            
            if (error) {
              console.error('Error checking existing phones:', error);
            } else if (existingContacts) {
              const existingNormalizedPhones = new Set(
                existingContacts
                  .map(contact => contact.phone)
                  .filter(phone => phone && isValidPhoneFormat(phone))
                  .map(phone => normalizePhoneNumber(phone))
              );
              
              uniquePhones.forEach(normalizedPhone => {
                if (existingNormalizedPhones.has(normalizedPhone)) {
                  dbDuplicates++;
                }
              });
            }
          } catch (error) {
            console.error('Error checking database duplicates:', error);
          }
        }
      }
      
      setInvalidPhoneCount(invalidPhones);
      setValidPhoneCount(validPhones);
      setPhoneDuplicatesInFile(fileDuplicates);
      setPhoneDuplicatesInDb(dbDuplicates);
      setDuplicateCount(fileDuplicates + dbDuplicates);
      setIsCheckingDuplicates(false);
    };
    
    checkPhoneDuplicates();
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
      setImportResult("Import started");
      onComplete();
    } catch (error) {
      console.error("Error starting import:", error);
      setImportResult("Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const contactsToImport = data.length - duplicateCount - invalidPhoneCount;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Verify Your Data</h2>
        <p className="text-muted-foreground">
          Review the data before importing. Phone number deduplication is enabled to prevent duplicate contacts.
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
                <p><strong>Will Import:</strong> {contactsToImport} contacts (out of {data.length} total)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Ready to Import with Phone Deduplication</AlertTitle>
        <AlertDescription>
          This will import {contactsToImport} unique contacts with enhanced phone number deduplication enabled.
        </AlertDescription>
      </Alert>
      
      {isCheckingDuplicates ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Checking for duplicate phone numbers...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Total Rows</p>
            <p className="text-2xl font-semibold">{data.length}</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-green-700">Will Import</p>
            <p className="text-2xl font-semibold text-green-700">{contactsToImport}</p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">Valid Phones</p>
            <p className="text-2xl font-semibold text-blue-700">{validPhoneCount}</p>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-md">
            <p className="text-sm text-amber-700">File Duplicates</p>
            <p className="text-2xl font-semibold text-amber-700">{phoneDuplicatesInFile}</p>
          </div>
          
          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-sm text-red-700">DB Duplicates</p>
            <p className="text-2xl font-semibold text-red-700">{phoneDuplicatesInDb}</p>
          </div>
        </div>
      )}
      
      {validPhoneCount > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">Phone Number Processing</AlertTitle>
          <AlertDescription className="text-green-700">
            {validPhoneCount} phone numbers will be standardized to (XXX) XXX-XXXX format during import.
          </AlertDescription>
        </Alert>
      )}
      
      {phoneDuplicatesInFile > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <Users className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">Duplicates in File</AlertTitle>
          <AlertDescription className="text-amber-700">
            {phoneDuplicatesInFile} duplicate phone numbers found within the uploaded file. Only the first occurrence of each phone number will be imported.
          </AlertDescription>
        </Alert>
      )}
      
      {phoneDuplicatesInDb > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700">Existing Phone Numbers</AlertTitle>
          <AlertDescription className="text-red-700">
            {phoneDuplicatesInDb} phone numbers already exist in your contact database and will be skipped to prevent duplicates.
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
            {countMissingValues()} records are missing both first and last names. These contacts may be imported with default names.
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
                          Will Format & Dedupe
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
          disabled={isImporting || isCheckingDuplicates || contactsToImport === 0}
          className="min-w-[120px]"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>Import {contactsToImport} Contacts</>
          )}
        </Button>
      </div>
      
      {/* Enhanced explanation of phone deduplication */}
      <div className="pt-4 text-sm text-muted-foreground border-t">
        <p className="font-medium">Enhanced Phone Number Deduplication:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Phone numbers are normalized to 10-digit format for comparison</li>
          <li>Duplicates within the file are automatically removed</li>
          <li>Phone numbers already in your database are detected and skipped</li>
          <li>All imported phones are formatted to (XXX) XXX-XXXX standard</li>
          <li>Detailed logging tracks all import actions in the contact_logs table</li>
        </ul>
      </div>
    </div>
  );
};

export default VerifyStage;
