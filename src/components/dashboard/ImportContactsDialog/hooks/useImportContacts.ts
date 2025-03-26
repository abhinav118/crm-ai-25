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
    
    // Find the phone column header
    const phoneHeader = columns.find(col => col.selected && col.mappedTo === 'phone')?.header;
    
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
        } 
        // Special handling for phone numbers - format them consistently
        else if (fieldName === 'phone' && value) {
          const formattedPhone = formatPhoneNumber(value);
          // Only use phone if it's valid or can be formatted properly
          if (isValidPhoneFormat(formattedPhone)) {
            transformedRow.phone = formattedPhone;
          } else {
            console.log(`Skipping invalid phone format: ${value} -> ${formattedPhone}`);
            // We don't set phone here, so it will be excluded if invalid
          }
        }
        // Special handling for tags - convert comma-separated string to array
        else if (fieldName === 'tags' && value) {
          try {
            // First, check if the value already looks like a JSON array string
            if (value.startsWith('[') && value.endsWith(']')) {
              try {
                transformedRow.tags = JSON.parse(value);
              } catch (e) {
                // If JSON parsing fails, fall back to splitting by comma
                transformedRow.tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
              }
            } else {
              // Handle comma-separated string (which might be quoted like "tag1,tag2")
              // Remove any outer quotes first
              const cleanValue = value.replace(/^["'](.+)["']$/, '$1');
              transformedRow.tags = cleanValue.split(',').map(tag => tag.trim()).filter(Boolean);
            }
            
            console.log(`Parsed tags from "${value}" to:`, transformedRow.tags);
          } catch (e) {
            console.error(`Error parsing tags from "${value}":`, e);
            // If all parsing fails, use an empty array to avoid database errors
            transformedRow.tags = [];
          }
        }
        else if (value !== undefined && value !== null && value !== '') {
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

      // Ensure tags is always an array
      if (transformedRow.tags && !Array.isArray(transformedRow.tags)) {
        console.log(`Converting tags to array: ${transformedRow.tags}`);
        if (typeof transformedRow.tags === 'string') {
          transformedRow.tags = transformedRow.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        } else {
          transformedRow.tags = [];
        }
      }
      
      // Set default empty array for tags if not present
      if (!transformedRow.tags) {
        transformedRow.tags = [];
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
      
      // First, update existing contacts to standardize phone format
      await standardizeExistingPhoneNumbers();
      
      // Get selected and mapped columns
      const selectedColumns = columns.filter(col => col.selected && col.mappedTo);
      console.log("Selected columns:", selectedColumns.map(c => `${c.header} -> ${c.mappedTo}`));
      
      // Check if we have any key fields to match existing contacts
      const emailColumn = selectedColumns.find(col => col.mappedTo === 'email');
      const phoneColumn = selectedColumns.find(col => col.mappedTo === 'phone');
      
      // Transform all data according to the column mapping
      const transformedData = prepareDataForImport();
      stats.total = transformedData.length;
      console.log(`Transformed ${stats.total} rows of data`);
      
      // Additional formatting and validation for phone numbers
      const validatedData = transformedData.map(row => {
        // If row has a phone, ensure it's properly formatted
        if (row.phone) {
          const formattedPhone = formatPhoneNumber(row.phone);
          
          // Check if the phone number format is valid
          if (isValidPhoneFormat(formattedPhone)) {
            row.phone = formattedPhone; // Use the formatted version
          } else {
            // Invalid phone format, mark for skipping
            row.skipDueToInvalidPhone = true;
            stats.skippedInvalidPhone++;
            console.log(`Skipping row with invalid phone: ${row.phone}`);
          }
        }
        return row;
      });
      
      // Filter out rows with invalid phone formats
      const validRows = validatedData.filter(row => !row.skipDueToInvalidPhone);
      console.log(`After phone validation: ${validRows.length} valid rows`);
      
      // Filter out duplicates by email and phone
      const uniquePhoneMap = new Map<string, boolean>(); // Track unique phone numbers
      const uniqueEmailMap = new Map<string, boolean>(); // Track unique emails
      const uniqueData: Record<string, any>[] = [];
      
      validRows.forEach(row => {
        const email = (row.email || '').toLowerCase().trim();
        const phone = (row.phone || '').trim();
        
        // Check if this phone number already exists
        if (phone && uniquePhoneMap.has(phone)) {
          stats.duplicates++;
          console.log(`Duplicate phone: ${phone}`);
          return;
        }
        
        // Check if this email already exists
        if (email && uniqueEmailMap.has(email)) {
          stats.duplicates++;
          console.log(`Duplicate email: ${email}`);
          return;
        }
        
        // Add to unique data if passed all checks
        if (phone) uniquePhoneMap.set(phone, true);
        if (email) uniqueEmailMap.set(email, true);
        uniqueData.push(row);
      });
      
      console.log(`Filtered out ${stats.duplicates} duplicate rows`);
      console.log(`Skipped ${stats.skippedInvalidPhone} rows with invalid phone format`);
      console.log(`Proceeding with ${uniqueData.length} unique rows`);
      
      // Validate the required fields are present
      const validatedUniqueData = uniqueData.filter(row => {
        // Name is required
        if (!row.name || row.name.trim() === '') {
          console.log(`Row missing required name field:`, row);
          errorDetails.push({row, error: 'Missing required name field'});
          stats.errors++;
          return false;
        }
        return true;
      });
      
      console.log(`After validation: ${validatedUniqueData.length} rows to process`);
      
      // Find existing contacts by email or phone to update instead of create
      let existingContacts: Record<string, any> = {};
      
      if (emailColumn || phoneColumn) {
        // Collect all unique email/phone values from the unique data
        const emailValues = validatedUniqueData
          .map(row => row.email)
          .filter(Boolean)
          .map(val => val.toLowerCase().trim());
        
        const phoneValues = validatedUniqueData
          .map(row => row.phone)
          .filter(Boolean)
          .map(val => val.trim());
        
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
            // Continue with the import process even if this lookup fails
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
            // Continue with the import process even if this lookup fails
          }
        }
      }
      
      // Process contacts in batches
      const batchSize = 10;
      const totalRows = validatedUniqueData.length;
      
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = validatedUniqueData.slice(i, i + batchSize);
        const createBatch = [];
        const updateBatch = [];
        
        // Process each row in the batch
        for (const row of batch) {
          // Check if this is a new contact or an update
          let isUpdate = false;
          let existingId = null;
          
          // Check by email
          if (row.email) {
            const email = row.email.trim().toLowerCase();
            if (existingContacts[email]) {
              isUpdate = true;
              existingId = existingContacts[email].id;
            }
          }
          
          // Check by phone if not already identified as an update
          if (!isUpdate && row.phone) {
            const phone = row.phone.trim();
            if (existingContacts[phone]) {
              isUpdate = true;
              existingId = existingContacts[phone].id;
            }
          }
          
          // Add to appropriate batch
          if (isUpdate && existingId) {
            updateBatch.push({
              id: existingId,
              ...row,
            });
          } else {
            createBatch.push(row);
          }
        }
        
        // Process creates
        if (createBatch.length > 0) {
          console.log(`Creating ${createBatch.length} new contacts`);
          try {
            const { data: created, error } = await supabase
              .from('contacts')
              .insert(createBatch)
              .select();
            
            if (error) {
              console.error('Error creating contacts:', error);
              // Check if this is a constraints violation error
              if (error.code === '23505') { // Unique constraint violation
                console.log('Constraint violation - likely duplicate key in database');
              } else if (error.code === '23502') { // Not null violation
                console.log('Not null constraint violation - missing required field');
              }
              
              // Record details of the failed batch
              createBatch.forEach(row => {
                errorDetails.push({row, error: `Create error: ${error.message || 'Unknown error'}`});
              });
              
              stats.errors += createBatch.length;
            } else {
              stats.created += created?.length || 0;
              console.log(`Successfully created ${created?.length || 0} contacts`);
              
              // Log each created contact to contact_logs table
              if (created && created.length > 0) {
                for (const newContact of created) {
                  try {
                    await logContactOperation(
                      newContact.id, 
                      newContact,
                      'Created', 
                      'Contact created via CSV import',
                      batchId,
                      batchName
                    );
                  } catch (logError) {
                    console.error('Error logging contact creation:', logError);
                    // Continue even if logging fails
                  }
                }
              }
            }
          } catch (error) {
            console.error('Exception during contact creation:', error);
            stats.errors += createBatch.length;
            createBatch.forEach(row => {
              errorDetails.push({row, error: `Exception during create: ${(error as Error).message || 'Unknown exception'}`});
            });
          }
        }
        
        // Process updates
        if (updateBatch.length > 0) {
          console.log(`Updating ${updateBatch.length} existing contacts`);
          for (const contact of updateBatch) {
            try {
              const { id, ...updateData } = contact;
              const { error } = await supabase
                .from('contacts')
                .update(updateData)
                .eq('id', id);
              
              if (error) {
                console.error(`Error updating contact ${id}:`, error);
                stats.errors++;
                errorDetails.push({row: contact, error: `Update error: ${error.message || 'Unknown error'}`});
              } else {
                stats.updated++;
                
                // Log the updated contact
                try {
                  await logContactOperation(
                    id,
                    { id, ...updateData },
                    'Update',
                    'Contact updated via CSV import',
                    batchId,
                    batchName
                  );
                } catch (logError) {
                  console.error('Error logging contact update:', logError);
                  // Continue even if logging fails
                }
              }
            } catch (error) {
              console.error(`Exception updating contact:`, error);
              stats.errors++;
              errorDetails.push({row: contact, error: `Exception during update: ${(error as Error).message || 'Unknown exception'}`});
            }
          }
        }
        
        // Update progress
        const progress = Math.min(100, Math.round(((i + batch.length) / totalRows) * 100));
        setImportProgress(progress);
      }
      
      // Import complete
      console.log("Import completed with stats:", stats);
      if (errorDetails.length > 0) {
        console.log("Error details:", errorDetails);
      }
      
      setImportStats(stats);
      
      // Show success message
      toast({
        title: stats.errors > 0 ? 'Import Completed with Errors' : 'Import Complete',
        description: `Successfully imported ${stats.total - stats.errors - stats.duplicates - stats.skippedInvalidPhone} contacts (${stats.created} created, ${stats.updated} updated). ${stats.duplicates} duplicates and ${stats.skippedInvalidPhone} invalid phone numbers skipped. ${stats.errors > 0 ? `${stats.errors} rows had errors.` : ''}`,
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
        name: contactData.name || 'Unnamed Contact',
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

  // Function to standardize existing phone numbers in the database
  const standardizeExistingPhoneNumbers = async () => {
    try {
      // Fetch all contacts with phone numbers
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, phone')
        .not('phone', 'is', null)
        .order('id');
      
      if (error) {
        console.error("Error fetching contacts for phone standardization:", error);
        return;
      }
      
      if (!contacts || contacts.length === 0) return;
      
      console.log(`Found ${contacts.length} contacts with phone numbers to standardize`);
      
      // Process in batches
      const batchSize = 50;
      let updatedCount = 0;
      
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, Math.min(i + batchSize, contacts.length));
        const updatePromises = batch.map(contact => {
          const formattedPhone = formatPhoneNumber(contact.phone);
          
          // Only update if the format has changed
          if (formattedPhone !== contact.phone) {
            return supabase
              .from('contacts')
              .update({ phone: formattedPhone })
              .eq('id', contact.id)
              .then(({ error }) => {
                if (error) {
                  console.error(`Error updating phone for contact ${contact.id}:`, error);
                  return false;
                }
                return true;
              });
          }
          return Promise.resolve(false);
        });
        
        const results = await Promise.all(updatePromises);
        updatedCount += results.filter(Boolean).length;
      }
      
      console.log(`Standardized ${updatedCount} contact phone numbers`);
      
      if (updatedCount > 0) {
        toast({
          title: 'Phone Numbers Standardized',
          description: `${updatedCount} existing contacts had their phone numbers updated to the standard format.`,
        });
      }
    } catch (error) {
      console.error("Error standardizing phone numbers:", error);
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

