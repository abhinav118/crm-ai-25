import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Users, 
  Tag,
  Loader2,
  Phone,
  Database
} from 'lucide-react';
import { CsvColumn } from './types';

interface VerifyStageProps {
  columns: CsvColumn[];
  data: any[];
  selectedColumns: CsvColumn[];
  onComplete: () => void;
  onBack: () => void;
  setImportResult: (result: any) => void;
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
  const [segmentName, setSegmentName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Generate default segment name
  useEffect(() => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
    setSegmentName(`Contacts_list_${date}_${time}`);
  }, []);

  const validateSegmentName = (name: string) => {
    return /^[a-zA-Z0-9\s]+$/.test(name);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/[^0-9]/g, '');
    
    // Format 10-digit numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    // Handle numbers with country code 1
    else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone; // Return original if not a valid format
  };

  const handleImport = async () => {
    if (!validateSegmentName(segmentName)) {
      toast({
        title: 'Invalid Segment Name',
        description: 'Segment name can only contain letters, numbers, and spaces.',
        variant: 'destructive'
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const contactsToImport = data.map(row => {
        const contact: any = {
          segment_name: segmentName.trim(),
          status: 'active',
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        selectedColumns.forEach(column => {
          if (column.mappedTo && row[column.name]) {
            let value = row[column.name];
            
            // Special handling for phone numbers
            if (column.mappedTo === 'phone') {
              value = formatPhoneNumber(value);
            }
            
            // Special handling for tags
            if (column.mappedTo === 'tags') {
              value = typeof value === 'string' ? value.split(',').map(tag => tag.trim()) : [];
            }
            
            contact[column.mappedTo] = value;
          }
        });

        return contact;
      });

      console.log('Importing contacts:', contactsToImport);

      const batchSize = 100;
      const totalBatches = Math.ceil(contactsToImport.length / batchSize);
      let created = 0;
      let errors = 0;
      let duplicates = 0;
      let phoneDuplicatesInFile = 0;
      let phoneDuplicatesInDb = 0;
      let skippedInvalidPhone = 0;

      // Check for phone duplicates within the file
      const phoneNumbers = contactsToImport
        .map(contact => contact.phone)
        .filter(phone => phone && phone.trim() !== '');
      
      const uniquePhones = new Set();
      const duplicatePhones = new Set();
      
      phoneNumbers.forEach(phone => {
        if (uniquePhones.has(phone)) {
          duplicatePhones.add(phone);
        } else {
          uniquePhones.add(phone);
        }
      });
      
      phoneDuplicatesInFile = duplicatePhones.size;

      // Remove file duplicates before processing
      const seenPhones = new Set();
      const deduplicatedContacts = contactsToImport.filter(contact => {
        if (contact.phone && seenPhones.has(contact.phone)) {
          return false;
        }
        if (contact.phone) seenPhones.add(contact.phone);
        return true;
      });

      for (let i = 0; i < totalBatches; i++) {
        const batch = deduplicatedContacts.slice(i * batchSize, (i + 1) * batchSize);
        
        try {
          const { data: insertedData, error } = await supabase
            .from('contacts')
            .insert(batch)
            .select();

          if (error) {
            console.error('Batch import error:', error);
            
            // Check if it's a phone duplicate error
            if (error.message?.includes('phone') || error.code === '23505') {
              phoneDuplicatesInDb += batch.length;
            } else {
              errors += batch.length;
            }
          } else {
            created += insertedData?.length || 0;
          }
        } catch (batchError) {
          console.error('Batch processing error:', batchError);
          errors += batch.length;
        }

        setImportProgress(Math.round(((i + 1) / totalBatches) * 100));
      }

      const importStats = {
        total: contactsToImport.length,
        created,
        errors,
        duplicates,
        phoneDuplicatesInFile,
        phoneDuplicatesInDb,
        skippedInvalidPhone
      };

      console.log('Import completed with stats:', importStats);

      setImportResult(importStats);
      onComplete();

      toast({
        title: 'Import Completed',
        description: `Successfully imported ${created} out of ${contactsToImport.length} contacts to segment "${segmentName}".`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred during import. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const previewData = data.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Segment Name Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Segment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="segment-name">Segment Name</Label>
            <Input
              id="segment-name"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              placeholder="e.g., VIP List"
              className="max-w-md"
            />
            <p className="text-sm text-gray-500">
              Optional but recommended. Use letters, numbers, and spaces only.
            </p>
          </div>
          
          {segmentName && !validateSegmentName(segmentName) && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Invalid segment name. Use only letters, numbers, and spaces.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Import Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">File Information</p>
              <div className="text-sm text-gray-600 space-y-1">
                <div>File: {fileName || 'Unknown'}</div>
                <div>Total Rows: {data.length}</div>
                <div>Segment: {segmentName}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Mapped Fields</p>
              <div className="flex flex-wrap gap-1">
                {selectedColumns.map((column) => (
                  <Badge key={column.name} variant="secondary" className="text-xs">
                    {column.mappedTo}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-4">
              <div className="space-y-4">
                {previewData.map((row, index) => (
                  <div key={index} className="border-b pb-3 last:border-b-0">
                    <div className="font-medium text-sm">Row {index + 1}</div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {selectedColumns.map((column) => (
                        <div key={column.name}>
                          <span className="font-medium">{column.mappedTo}:</span>
                          <span className="ml-2 text-gray-600">
                            {column.mappedTo === 'phone' 
                              ? formatPhoneNumber(row[column.name] || '') 
                              : row[column.name] || '-'
                            }
                          </span>
                        </div>
                      ))}
                      <div>
                        <span className="font-medium">segment:</span>
                        <span className="ml-2 text-gray-600">{segmentName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          Back
        </Button>
        
        <Button 
          onClick={handleImport} 
          disabled={isImporting || !segmentName.trim() || !validateSegmentName(segmentName)}
          className="gap-2"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing... {importProgress}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import {data.length} Contacts
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerifyStage;
