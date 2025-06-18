import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CsvColumn, ImportStage } from '../types';

interface UseImportContactsProps {
  onImportSuccess?: () => void;
}

// Helper function to format phone numbers consistently to (XXX) XXX-XXXX format
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if we have a valid US number (10 digits)
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Handle numbers with country code 1
    return `(${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 11)}`;
  }
  
  // If not valid US format, return original but trimmed
  return phone.trim();
};

// Helper to normalize phone numbers for comparison
export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Normalize to 10 digits (remove leading 1 if present)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned.substring(1);
  } else if (cleaned.length === 10) {
    return cleaned;
  }
  
  // Return original cleaned if not standard format
  return cleaned;
};

// Helper to check if the phone is valid or can be formatted correctly
export const isValidPhoneFormat = (phone: string): boolean => {
  if (!phone) return false;
  
  // Check if it already matches our format: (XXX) XXX-XXXX
  if (/^\(\d{3}\) \d{3}-\d{4}$/.test(phone)) return true;
  
  // Otherwise, check if it can be formatted to our standard format
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
};

// Define proper types for validation results
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  cleanedData?: Record<string, any>;
}

interface ValidatedContact extends Record<string, any> {
  _validationErrors?: string[];
  _isValid: boolean;
}

// Define the contact insert type to match Supabase schema
interface ContactInsert {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  status?: string;
  tags?: string[];
  notes?: string | null;
}

// Helper to validate and clean contact data
const validateAndCleanContact = (row: Record<string, any>, index: number): ValidationResult => {
  const errors: string[] = [];
  const cleanedData: Record<string, any> = { ...row };
  
  // Validate and clean first_name
  if (cleanedData.first_name) {
    if (typeof cleanedData.first_name !== 'string') {
      cleanedData.first_name = String(cleanedData.first_name);
    }
    cleanedData.first_name = cleanedData.first_name.trim();
    if (cleanedData.first_name.length > 100) {
      errors.push(`First name exceeds 100 characters (row ${index + 1})`);
    }
  }
  
  // Validate and clean last_name
  if (cleanedData.last_name) {
    if (typeof cleanedData.last_name !== 'string') {
      cleanedData.last_name = String(cleanedData.last_name);
    }
    cleanedData.last_name = cleanedData.last_name.trim();
    if (cleanedData.last_name.length > 100) {
      errors.push(`Last name exceeds 100 characters (row ${index + 1})`);
    }
  }
  
  // Check if we have at least first_name or last_name
  if (!cleanedData.first_name && !cleanedData.last_name) {
    errors.push(`Missing required name fields (row ${index + 1})`);
  }
  
  // Validate and clean email
  if (cleanedData.email) {
    if (typeof cleanedData.email !== 'string') {
      cleanedData.email = String(cleanedData.email);
    }
    cleanedData.email = cleanedData.email.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedData.email)) {
      errors.push(`Invalid email format: ${cleanedData.email} (row ${index + 1})`);
      cleanedData.email = null; // Set to null if invalid
    } else if (cleanedData.email.length > 254) {
      errors.push(`Email exceeds 254 characters (row ${index + 1})`);
    }
  }
  
  // Validate and clean phone
  if (cleanedData.phone) {
    if (typeof cleanedData.phone !== 'string') {
      cleanedData.phone = String(cleanedData.phone);
    }
    const formattedPhone = formatPhoneNumber(cleanedData.phone);
    if (isValidPhoneFormat(formattedPhone)) {
      cleanedData.phone = formattedPhone;
    } else {
      errors.push(`Invalid phone format: ${cleanedData.phone} (row ${index + 1})`);
      cleanedData.phone = null; // Set to null if invalid
    }
  }
  
  // Validate and clean company
  if (cleanedData.company) {
    if (typeof cleanedData.company !== 'string') {
      cleanedData.company = String(cleanedData.company);
    }
    cleanedData.company = cleanedData.company.trim();
    if (cleanedData.company.length > 200) {
      errors.push(`Company name exceeds 200 characters (row ${index + 1})`);
    }
    if (cleanedData.company === '') {
      cleanedData.company = null;
    }
  }
  
  // Validate status
  if (cleanedData.status) {
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(cleanedData.status)) {
      cleanedData.status = 'active'; // Default to active
    }
  } else {
    cleanedData.status = 'active';
  }
  
  // Validate and clean tags
  if (cleanedData.tags) {
    if (!Array.isArray(cleanedData.tags)) {
      if (typeof cleanedData.tags === 'string') {
        try {
          // Try to parse as JSON first
          if (cleanedData.tags.startsWith('[') && cleanedData.tags.endsWith(']')) {
            cleanedData.tags = JSON.parse(cleanedData.tags);
          } else {
            // Split by comma
            cleanedData.tags = cleanedData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
          }
        } catch {
          cleanedData.tags = [];
        }
      } else {
        cleanedData.tags = [];
      }
    }
    
    // Ensure all tags are strings and not too long
    cleanedData.tags = cleanedData.tags
      .map(tag => typeof tag === 'string' ? tag.trim() : String(tag).trim())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .slice(0, 10); // Limit to 10 tags max
  } else {
    cleanedData.tags = [];
  }
  
  // Validate notes
  if (cleanedData.notes) {
    if (typeof cleanedData.notes !== 'string') {
      cleanedData.notes = String(cleanedData.notes);
    }
    cleanedData.notes = cleanedData.notes.trim();
    if (cleanedData.notes.length > 2000) {
      cleanedData.notes = cleanedData.notes.substring(0, 2000); // Truncate if too long
    }
    if (cleanedData.notes === '') {
      cleanedData.notes = null;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanedData: errors.length === 0 ? cleanedData : undefined
  };
};

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
    duplicates: 0,
    skippedInvalidPhone: 0,
    phoneDuplicatesInFile: 0,
    phoneDuplicatesInDb: 0,
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
      duplicates: 0,
      skippedInvalidPhone: 0,
      phoneDuplicatesInFile: 0,
      phoneDuplicatesInDb: 0,
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

  const prepareDataForImport = (): ValidatedContact[] => {
    // Get the mapping of CSV headers to database fields
    const headerToFieldMap = columns.reduce((map, column) => {
      if (column.selected && column.mappedTo) {
        map[column.header] = column.mappedTo;
      }
      return map;
    }, {} as Record<string, string>);

    console.log("Header to field map:", headerToFieldMap);
    
    // Transform the data according to the mapping
    return data.map((row, index) => {
      const transformedRow: Record<string, any> = {
        // Default values
        status: 'active',
        tags: [],
      };
      
      // Apply mappings from CSV to database fields
      Object.keys(headerToFieldMap).forEach(header => {
        const fieldName = headerToFieldMap[header];
        const value = row[header];
        
        if (value !== undefined && value !== null && value !== '') {
          transformedRow[fieldName] = value;
        }
      });
      
      // Validate and clean the data
      const validation = validateAndCleanContact(transformedRow, index);
      
      if (!validation.isValid) {
        console.log(`Validation errors for row ${index + 1}:`, validation.errors);
        return {
          ...transformedRow,
          _validationErrors: validation.errors,
          _isValid: false
        } as ValidatedContact;
      }
      
      return {
        ...validation.cleanedData,
        _isValid: true
      } as ValidatedContact;
    });
  };

  // Helper function to ensure contact data conforms to expected type
  const prepareContactForInsert = (row: Record<string, any>): ContactInsert => {
    return {
      first_name: row.first_name || row.last_name || 'Unknown',
      last_name: row.last_name || null,
      email: row.email || null,
      phone: row.phone || null,
      company: row.company || null,
      status: row.status || 'active',
      tags: Array.isArray(row.tags) ? row.tags : [],
      notes: row.notes || null,
    };
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
      duplicates: 0,
      skippedInvalidPhone: 0,
      phoneDuplicatesInFile: 0,
      phoneDuplicatesInDb: 0,
    };
    
    // Keep track of specific error details
    const errorDetails: Array<{row: any, error: string}> = [];
    
    // Generate a batch ID and name for logging
    const batchId = crypto.randomUUID();
    const batchName = file?.name || `Imported contacts ${new Date().toLocaleString()}`;
    
    try {
      console.log("Starting import process with enhanced phone deduplication...");
      console.log("Import batch:", { batchId, batchName });
      
      // Transform all data according to the column mapping
      const transformedData = prepareDataForImport();
      stats.total = transformedData.length;
      console.log(`Transformed ${stats.total} rows of data`);
      
      // Separate valid and invalid rows
      const validRows = transformedData.filter(row => row._isValid);
      const invalidRows = transformedData.filter(row => !row._isValid);
      
      console.log(`${validRows.length} valid rows, ${invalidRows.length} invalid rows`);
      
      // Count validation errors
      stats.errors += invalidRows.length;
      invalidRows.forEach(row => {
        // Type guard to check if validation errors exist
        if ('_validationErrors' in row && Array.isArray(row._validationErrors)) {
          row._validationErrors.forEach((error: string) => {
            errorDetails.push({row, error});
          });
        }
      });
      
      // Remove validation metadata from valid rows and ensure required fields
      const cleanValidRows = validRows.map(row => {
        const { _isValid, _validationErrors, ...cleanRow } = row;
        
        // Ensure first_name is always present (required field)
        if (!cleanRow.first_name) {
          cleanRow.first_name = cleanRow.last_name || 'Unknown';
        }
        
        return cleanRow;
      }).filter(row => row.first_name); // Extra safety check
      
      // Enhanced phone number deduplication within the file
      const phoneMap = new Map<string, Record<string, any>>();
      const phoneDuplicatesInFile: Record<string, any>[] = [];
      
      cleanValidRows.forEach(row => {
        if (row.phone && isValidPhoneFormat(row.phone)) {
          const normalizedPhone = normalizePhoneNumber(row.phone);
          
          if (phoneMap.has(normalizedPhone)) {
            // This is a duplicate phone number within the file
            phoneDuplicatesInFile.push(row);
            stats.phoneDuplicatesInFile++;
            console.log(`Duplicate phone in file: ${row.phone} (normalized: ${normalizedPhone})`);
          } else {
            phoneMap.set(normalizedPhone, row);
          }
        }
      });
      
      // Get unique contacts (remove phone duplicates within file)
      const uniqueContactsFromFile = Array.from(phoneMap.values()).concat(
        cleanValidRows.filter(row => !row.phone || !isValidPhoneFormat(row.phone))
      );
      
      console.log(`After file deduplication: ${uniqueContactsFromFile.length} unique contacts (${stats.phoneDuplicatesInFile} phone duplicates removed from file)`);
      
      // Check against existing database phone numbers
      const phoneNumbers = uniqueContactsFromFile
        .map(row => row.phone)
        .filter(phone => phone && isValidPhoneFormat(phone))
        .map(phone => normalizePhoneNumber(phone));
      
      console.log(`Checking ${phoneNumbers.length} phone numbers against database...`);
      
      let existingPhoneNumbers = new Set<string>();
      
      if (phoneNumbers.length > 0) {
        try {
          // Get all existing contacts with phones
          const { data: existingContacts, error } = await supabase
            .from('contacts')
            .select('phone')
            .not('phone', 'is', null);
          
          if (error) {
            console.error('Error fetching existing phone numbers:', error);
            throw error;
          }
          
          if (existingContacts) {
            existingContacts.forEach(contact => {
              if (contact.phone && isValidPhoneFormat(contact.phone)) {
                const normalized = normalizePhoneNumber(contact.phone);
                existingPhoneNumbers.add(normalized);
              }
            });
          }
          
          console.log(`Found ${existingPhoneNumbers.size} existing phone numbers in database`);
        } catch (error) {
          console.error('Error checking existing phone numbers:', error);
          // Continue with import but log the error
          errorDetails.push({row: {}, error: `Failed to check existing phone numbers: ${(error as Error).message}`});
        }
      }
      
      // Filter out contacts with phone numbers that already exist in database
      const newContacts: Record<string, any>[] = [];
      const phoneDuplicatesInDb: Record<string, any>[] = [];
      
      uniqueContactsFromFile.forEach(row => {
        if (row.phone && isValidPhoneFormat(row.phone)) {
          const normalizedPhone = normalizePhoneNumber(row.phone);
          
          if (existingPhoneNumbers.has(normalizedPhone)) {
            phoneDuplicatesInDb.push(row);
            stats.phoneDuplicatesInDb++;
            console.log(`Phone number already exists in database: ${row.phone} (normalized: ${normalizedPhone})`);
          } else {
            newContacts.push(row);
          }
        } else {
          // Contacts without valid phone numbers can still be imported
          newContacts.push(row);
        }
      });
      
      console.log(`After database deduplication: ${newContacts.length} contacts to import (${stats.phoneDuplicatesInDb} phone duplicates found in database)`);
      
      // Process remaining unique contacts in smaller batches
      const batchSize = 5; // Reduced batch size
      const totalRows = newContacts.length;
      
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = newContacts.slice(i, i + batchSize);
        
        // Process each contact individually to avoid batch failures
        for (const row of batch) {
          try {
            // Create new contact - prepare data for insert
            const insertData = prepareContactForInsert(row);
            const { data: created, error } = await supabase
              .from('contacts')
              .insert(insertData)
              .select();
            
            if (error) {
              console.error('Error creating contact:', error);
              stats.errors++;
              errorDetails.push({row, error: `Create error: ${error.message}`});
            } else {
              stats.created += created?.length || 0;
              console.log(`Successfully created contact`);
              
              // Log the created contact
              if (created && created.length > 0) {
                try {
                  await logContactOperation(
                    created[0].id,
                    created[0],
                    'Created',
                    'Contact created via CSV import',
                    batchId,
                    batchName
                  );
                } catch (logError) {
                  console.error('Error logging contact creation:', logError);
                }
              }
            }
          } catch (error) {
            console.error(`Exception processing contact:`, error);
            stats.errors++;
            errorDetails.push({row, error: `Exception: ${(error as Error).message}`});
          }
        }
        
        // Update progress
        const progress = Math.min(100, Math.round(((i + batch.length) / totalRows) * 100));
        setImportProgress(progress);
      }
      
      // Update total duplicates count
      stats.duplicates = stats.phoneDuplicatesInFile + stats.phoneDuplicatesInDb;
      
      // Import complete
      console.log("Import completed with enhanced phone deduplication stats:", stats);
      if (errorDetails.length > 0) {
        console.log("Error details:", errorDetails.slice(0, 10)); // Log first 10 errors
      }
      
      setImportStats(stats);
      
      // Show success message with detailed phone deduplication info
      const successfulImports = stats.created;
      const totalSkipped = stats.duplicates + stats.errors + stats.skippedInvalidPhone;
      
      let description = `Successfully imported ${successfulImports} contacts.`;
      
      if (totalSkipped > 0) {
        const skipReasons = [];
        if (stats.phoneDuplicatesInFile > 0) {
          skipReasons.push(`${stats.phoneDuplicatesInFile} duplicate phones in file`);
        }
        if (stats.phoneDuplicatesInDb > 0) {
          skipReasons.push(`${stats.phoneDuplicatesInDb} phones already in database`);
        }
        if (stats.errors > 0) {
          skipReasons.push(`${stats.errors} errors`);
        }
        if (stats.skippedInvalidPhone > 0) {
          skipReasons.push(`${stats.skippedInvalidPhone} invalid phones`);
        }
        
        description += ` ${totalSkipped} rows skipped: ${skipReasons.join(', ')}.`;
      }
      
      toast({
        title: stats.errors > 0 ? 'Import Completed with Errors' : 'Import Complete',
        description: description,
        variant: stats.errors > 0 ? 'destructive' : 'default',
      });
      
      // Call success callback
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      // Move to the import completion stage
      setStage('import');
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: `An error occurred during the import process: ${(error as Error).message}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Helper function to log contact operations to contact_logs table
  const logContactOperation = async (
    contactId: string,
    contactData: Record<string, any>,
    action: string,
    description: string,
    batchId: string,
    batchName: string
  ) => {
    try {
      // Create a properly structured contact_info JSON object
      const contactInfo = {
        id: contactId,
        first_name: contactData.first_name || '',
        last_name: contactData.last_name || '',
        email: contactData.email || null,
        phone: contactData.phone || null,
        status: contactData.status || 'active',
        company: contactData.company || null,
        tags: Array.isArray(contactData.tags) ? contactData.tags : [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        description: description
      };

      // Insert the log entry
      const { error } = await supabase
        .from('contact_logs')
        .insert({
          action: action,
          contact_info: contactInfo,
          created_at: new Date().toISOString(),
          batch_id: batchId,
          batch_name: batchName
        });

      if (error) {
        console.error('Error creating contact log:', error);
      }
    } catch (error) {
      console.error('Exception logging contact operation:', error);
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
    formatPhoneNumber,
    isValidPhoneFormat,
  };
};
