import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CsvColumn, ImportStage } from '../types';

interface UseImportContactsProps {
  onImportSuccess?: () => void;
}

export const useImportContacts = ({ onImportSuccess }: UseImportContactsProps) => {
  const [stage, setStage] = useState<ImportStage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<CsvColumn[]>([]);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({
    total: 0,
    created: 0,
    updated: 0,
    errors: 0,
  });

  const resetState = () => {
    setStage('upload');
    setFile(null);
    setColumns([]);
    setData([]);
    setIsImporting(false);
    setImportProgress(0);
    setImportStats({
      total: 0,
      created: 0,
      updated: 0,
      errors: 0,
    });
  };

  const handleClose = (onOpenChange: (open: boolean) => void) => {
    if (isImporting) {
      toast({
        title: 'Import in progress',
        description: 'Please wait for the import to complete before closing.',
      });
      return;
    }
    
    resetState();
    onOpenChange(false);
  };

  const goToNextStage = async () => {
    if (stage === 'upload') {
      if (!file) {
        toast({
          title: 'No file selected',
          description: 'Please select a CSV file to import.',
          variant: 'destructive',
        });
        return;
      }
      setStage('map');
    } else if (stage === 'map') {
      // Validate that at least one column is mapped
      const mappedColumns = columns.filter(col => col.selected && col.mappedTo);
      if (mappedColumns.length === 0) {
        toast({
          title: 'No columns mapped',
          description: 'Please map at least one column to a contact field.',
          variant: 'destructive',
        });
        return;
      }
      setStage('verify');
    } else if (stage === 'verify') {
      await importContacts();
    }
  };

  const goToPreviousStage = () => {
    if (stage === 'map') {
      setStage('upload');
    } else if (stage === 'verify') {
      setStage('map');
    }
  };

  const handleFileSelected = (selectedFile: File, parsedColumns: CsvColumn[], parsedData: Record<string, string>[]) => {
    console.log("File selected:", selectedFile.name);
    console.log("Parsed columns:", parsedColumns);
    console.log("Sample data:", parsedData.slice(0, 2));
    
    setFile(selectedFile);
    setColumns(parsedColumns);
    setData(parsedData);
    setStage('map');
  };

  const prepareDataForImport = () => {
    // Get the mapping of CSV headers to database fields
    const headerToFieldMap = columns.reduce((map, column) => {
      if (column.selected && column.mappedTo) {
        map[column.header] = column.mappedTo;
      }
      return map;
    }, {} as Record<string, string>);

    console.log("Header to field map:", headerToFieldMap);
    
    // Special case for first name + last name combination
    const firstNameHeader = columns.find(col => 
      col.selected && col.header.toLowerCase().includes('first') && col.header.toLowerCase().includes('name')
    )?.header;
    
    const lastNameHeader = columns.find(col => 
      col.selected && col.header.toLowerCase().includes('last') && col.header.toLowerCase().includes('name')
    )?.header;
    
    // Transform the data according to the mapping
    return data.map(row => {
      const transformedRow: Record<string, any> = {
        // Default values
        name: 'Imported Contact',
        status: 'active',
      };
      
      // Apply mappings from CSV to database fields
      Object.keys(headerToFieldMap).forEach(header => {
        const fieldName = headerToFieldMap[header];
        const value = row[header];
        
        // Special handling for combining first and last names
        if (fieldName === 'name' && firstNameHeader && lastNameHeader) {
          // If this is a first name column and we also have a last name column
          if (header === firstNameHeader) {
            const firstName = row[firstNameHeader] || '';
            const lastName = row[lastNameHeader] || '';
            
            if (firstName || lastName) {
              transformedRow.name = `${firstName} ${lastName}`.trim();
            }
          }
        } else if (value !== undefined && value !== null && value !== '') {
          // Normal field mapping for non-empty values
          transformedRow[fieldName] = value;
        } else if (columns.find(c => c.header === header)?.updateEmptyValues) {
          // Handle columns marked for empty value replacement
          if (fieldName === 'name') transformedRow.name = 'Imported Contact';
          else if (fieldName === 'status') transformedRow.status = 'active';
          else if (fieldName === 'tags') transformedRow.tags = [];
        }
      });
      
      // Make sure name is always set
      if (!transformedRow.name || transformedRow.name === '') {
        transformedRow.name = 'Imported Contact';
      }
      
      console.log("Transformed row:", transformedRow);
      return transformedRow;
    });
  };

  const importContacts = async () => {
    setIsImporting(true);
    setImportProgress(0);
    
    // Reset import stats
    const stats = {
      total: 0,
      created: 0,
      updated: 0,
      errors: 0,
    };
    
    try {
      // Get selected and mapped columns
      const selectedColumns = columns.filter(col => col.selected && col.mappedTo);
      
      // Check if we have any key fields to match existing contacts
      const emailColumn = selectedColumns.find(col => col.mappedTo === 'email');
      const phoneColumn = selectedColumns.find(col => col.mappedTo === 'phone');
      
      // Find existing contacts by email or phone to update instead of create
      let existingContacts: Record<string, any> = {};
      
      if (emailColumn || phoneColumn) {
        // Collect all unique email/phone values
        const emailValues = emailColumn 
          ? data
              .map(row => row[emailColumn.header])
              .filter(Boolean)
              .map(val => val.trim())
          : [];
        
        const phoneValues = phoneColumn
          ? data
              .map(row => row[phoneColumn.header])
              .filter(Boolean)
              .map(val => val.trim())
          : [];
        
        // Fetch existing contacts by email or phone
        if (emailValues.length > 0) {
          const { data: emailContacts } = await supabase
            .from('contacts')
            .select('id, email')
            .in('email', emailValues);
          
          if (emailContacts) {
            emailContacts.forEach(contact => {
              if (contact.email) {
                existingContacts[contact.email.toLowerCase()] = contact;
              }
            });
          }
        }
        
        if (phoneValues.length > 0) {
          const { data: phoneContacts } = await supabase
            .from('contacts')
            .select('id, phone')
            .in('phone', phoneValues);
          
          if (phoneContacts) {
            phoneContacts.forEach(contact => {
              if (contact.phone) {
                existingContacts[contact.phone] = contact;
              }
            });
          }
        }
      }
      
      // Process contacts in batches
      const batchSize = 10;
      const totalRows = data.length;
      stats.total = totalRows;
      
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const createBatch = [];
        const updateBatch = [];
        
        // Process each row in the batch
        for (const row of batch) {
          // Create a contact object
          const contact: Record<string, any> = {
            status: 'active', // Default status
          };
          
          // Apply mapped values
          for (const column of selectedColumns) {
            if (!column.mappedTo) continue;
            
            const value = row[column.header]?.trim() || null;
            
            // Skip empty values
            if (value === null) continue;
            
            // Special case for tags
            if (column.mappedTo === 'tags' && value) {
              // Split tags by comma, handling quoted values
              try {
                // First try to parse as a comma-separated list
                contact.tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
              } catch (e) {
                // If that fails, just use the value as is
                contact.tags = [value];
              }
              continue;
            }
            
            // Normal fields
            contact[column.mappedTo] = value;
          }
          
          // Check if this is a new contact or an update
          let isUpdate = false;
          let existingId = null;
          
          // Check by email
          if (emailColumn && row[emailColumn.header]) {
            const email = row[emailColumn.header].trim().toLowerCase();
            if (existingContacts[email]) {
              isUpdate = true;
              existingId = existingContacts[email].id;
            }
          }
          
          // Check by phone if not already identified as an update
          if (!isUpdate && phoneColumn && row[phoneColumn.header]) {
            const phone = row[phoneColumn.header].trim();
            if (existingContacts[phone]) {
              isUpdate = true;
              existingId = existingContacts[phone].id;
            }
          }
          
          // Add to appropriate batch
          if (isUpdate && existingId) {
            updateBatch.push({
              id: existingId,
              ...contact,
            });
          } else {
            createBatch.push(contact);
          }
        }
        
        // Process creates
        if (createBatch.length > 0) {
          const { data: created, error } = await supabase
            .from('contacts')
            .insert(createBatch)
            .select();
          
          if (error) {
            console.error('Error creating contacts:', error);
            stats.errors += createBatch.length;
          } else {
            stats.created += created?.length || 0;
          }
        }
        
        // Process updates
        if (updateBatch.length > 0) {
          for (const contact of updateBatch) {
            const { id, ...updateData } = contact;
            const { error } = await supabase
              .from('contacts')
              .update(updateData)
              .eq('id', id);
            
            if (error) {
              console.error(`Error updating contact ${id}:`, error);
              stats.errors++;
            } else {
              stats.updated++;
            }
          }
        }
        
        // Update progress
        const progress = Math.min(100, Math.round(((i + batch.length) / totalRows) * 100));
        setImportProgress(progress);
      }
      
      // Import complete
      setImportStats(stats);
      
      // Show success message
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${stats.total - stats.errors} contacts (${stats.created} created, ${stats.updated} updated).`,
      });
      
      // Call success callback
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred during the import process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    stage,
    setStage,
    file,
    columns,
    setColumns,
    data,
    isImporting,
    importProgress,
    importStats,
    handleFileSelected,
    goToNextStage,
    goToPreviousStage,
    handleClose,
  };
};
