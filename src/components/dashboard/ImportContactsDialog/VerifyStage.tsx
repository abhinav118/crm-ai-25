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
  setSegmentName: (name: string) => void;
}

const VerifyStage: React.FC<VerifyStageProps> = ({
  columns,
  data,
  selectedColumns,
  onComplete,
  onBack,
  setImportResult,
  fileName,
  setSegmentName,
}) => {
  const [localSegmentName, setLocalSegmentName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Generate default segment name
  useEffect(() => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const defaultSegmentName = `Imported_${date}_${time}`;
    setLocalSegmentName(defaultSegmentName);
    setSegmentName(defaultSegmentName);
  }, [setSegmentName]);

  const handleSegmentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalSegmentName(newName);
    setSegmentName(newName);
  };

  const validateSegmentName = (name: string) => {
    return name.length > 0 && /^[a-zA-Z0-9_\s-]+$/.test(name);
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
    if (!validateSegmentName(localSegmentName)) {
      toast({
        title: 'Invalid Segment Name',
        description: 'Segment name can only contain letters, numbers, spaces, underscores, and hyphens.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const contactsToImport = data.map(row => {
        const contact: any = {
          segment_name: localSegmentName.trim(),
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
        description: `Successfully imported ${created} out of ${contactsToImport.length} contacts to segment "${localSegmentName}".`,
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
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="segmentName">Segment Name</Label>
              <Input
                id="segmentName"
                value={localSegmentName}
                onChange={handleSegmentNameChange}
                placeholder="Enter segment name"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This name will be used to identify this group of contacts
              </p>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">Import Summary</h3>
              <ul className="text-sm space-y-1">
                <li>Total Contacts: {data.length}</li>
                <li>Selected Fields: {selectedColumns.length}</li>
                <li>File Name: {fileName || 'N/A'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[300px] rounded-md border">
        {/* Preview table content */}
      </ScrollArea>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={isImporting || !validateSegmentName(localSegmentName)}
        >
          {isImporting ? 'Importing...' : 'Import Contacts'}
        </Button>
      </div>
    </div>
  );
};

export default VerifyStage;
