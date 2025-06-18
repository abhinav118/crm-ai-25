
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
    };
    
    // Keep track of specific error details
    const errorDetails: Array<{row: any, error: string}> = [];
    
    // Generate a batch ID and name for logging
    const batchId = crypto.randomUUID();
    const batchName = file?.name || `Imported contacts ${new Date().toLocaleString()}`;
    
    try {
      console.log("Starting import process...");
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
        if ('_validationErrors' in row && row._validationErrors) {
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
      
      // Filter out duplicates by email and phone
      const uniqueEmailMap = new Map<string, boolean>();
      const uniquePhoneMap = new Map<string, boolean>();
      const uniqueData: Record<string, any>[] = [];
      
      cleanValidRows.forEach(row => {
        const email = row.email ? String(row.email).toLowerCase().trim() : '';
        const phone = row.phone ? String(row.phone).trim() : '';
        
        // Create a unique key based on email and phone
        let isDuplicate = false;
        
        if (email && uniqueEmailMap.has(email)) {
          isDuplicate = true;
        }
        
        if (phone && uniquePhoneMap.has(phone)) {
          isDuplicate = true;
        }
        
        if (isDuplicate) {
          stats.duplicates++;
          console.log(`Duplicate found: email=${email}, phone=${phone}`);
          return;
        }
        
        // Add to tracking maps
        if (email) uniqueEmailMap.set(email, true);
        if (phone) uniquePhoneMap.set(phone, true);
        
        uniqueData.push(row);
      });
      
      console.log(`Filtered out ${stats.duplicates} duplicate rows`);
      console.log(`Proceeding with ${uniqueData.length} unique valid rows`);
      
      // Find existing contacts by email or phone to update instead of create
      let existingContacts: Record<string, any> = {};
      
      // Collect all unique email/phone values from the unique data
      const emailValues = uniqueData
        .map(row => row.email)
        .filter(Boolean)
        .map(val => String(val).toLowerCase().trim());
      
      const phoneValues = uniqueData
        .map(row => row.phone)
        .filter(Boolean)
        .map(val => String(val).trim());
      
      console.log(`Searching for ${emailValues.length} unique emails and ${phoneValues.length} unique phones`);
      
      // Fetch existing contacts by email or phone
      if (emailValues.length > 0) {
        try {
          const { data: emailContacts, error } = await supabase
            .from('contacts')
            .select('id, email')
            .in('email', emailValues);
          
          if (error) {
            console.error('Error looking up contacts by email:', error);
            throw error;
          }
          
          if (emailContacts) {
            console.log(`Found ${emailContacts.length} existing contacts by email`);
            emailContacts.forEach(contact => {
              if (contact.email) {
                existingContacts[contact.email.toLowerCase()] = contact;
              }
            });
          }
        } catch (error) {
          console.error('Error fetching contacts by email:', error);
        }
      }
      
      if (phoneValues.length > 0) {
        try {
          const { data: phoneContacts, error } = await supabase
            .from('contacts')
            .select('id, phone')
            .in('phone', phoneValues);
          
          if (error) {
            console.error('Error looking up contacts by phone:', error);
            throw error;
          }
          
          if (phoneContacts) {
            console.log(`Found ${phoneContacts.length} existing contacts by phone`);
            phoneContacts.forEach(contact => {
              if (contact.phone) {
                existingContacts[contact.phone] = contact;
              }
            });
          }
        } catch (error) {
          console.error('Error fetching contacts by phone:', error);
        }
      }
      
      // Process contacts in smaller batches
      const batchSize = 5; // Reduced batch size
      const totalRows = uniqueData.length;
      
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = uniqueData.slice(i, i + batchSize);
        
        // Process each contact individually to avoid batch failures
        for (const row of batch) {
          try {
            // Check if this is a new contact or an update
            let isUpdate = false;
            let existingId = null;
            
            // Check by email
            if (row.email) {
              const email = String(row.email).trim().toLowerCase();
              if (existingContacts[email]) {
                isUpdate = true;
                existingId = existingContacts[email].id;
              }
            }
            
            // Check by phone if not already identified as an update
            if (!isUpdate && row.phone) {
              const phone = String(row.phone).trim();
              if (existingContacts[phone]) {
                isUpdate = true;
                existingId = existingContacts[phone].id;
              }
            }
            
            if (isUpdate && existingId) {
              // Update existing contact
              const { error } = await supabase
                .from('contacts')
                .update(row)
                .eq('id', existingId);
              
              if (error) {
                console.error(`Error updating contact ${existingId}:`, error);
                stats.errors++;
                errorDetails.push({row, error: `Update error: ${error.message}`});
              } else {
                stats.updated++;
                
                // Log the updated contact
                try {
                  await logContactOperation(
                    existingId,
                    { id: existingId, ...row },
                    'Update',
                    'Contact updated via CSV import',
                    batchId,
                    batchName
                  );
                } catch (logError) {
                  console.error('Error logging contact update:', logError);
                }
              }
            } else {
              // Create new contact - insert individual contact
              const { data: created, error } = await supabase
                .from('contacts')
                .insert(row)
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
      
      // Import complete
      console.log("Import completed with stats:", stats);
      if (errorDetails.length > 0) {
        console.log("Error details:", errorDetails.slice(0, 10)); // Log first 10 errors
      }
      
      setImportStats(stats);
      
      // Show success message
      const successfulImports = stats.created + stats.updated;
      const skippedTotal = stats.duplicates + stats.errors;
      
      toast({
        title: stats.errors > 0 ? 'Import Completed with Errors' : 'Import Complete',
        description: `Successfully imported ${successfulImports} contacts (${stats.created} created, ${stats.updated} updated). ${skippedTotal > 0 ? `${skippedTotal} rows skipped due to errors or duplicates.` : ''}`,
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
