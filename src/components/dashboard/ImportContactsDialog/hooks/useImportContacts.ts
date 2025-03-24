
import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CsvColumn, ImportStage } from '../types';

export function useImportContacts({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [stage, setStage] = useState<ImportStage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<CsvColumn[]>([]);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const resetState = () => {
    setStage('upload');
    setFile(null);
    setColumns([]);
    setData([]);
    setIsImporting(false);
  };

  const handleClose = (onOpenChange: (open: boolean) => void) => {
    resetState();
    onOpenChange(false);
  };

  const goToNextStage = () => {
    if (stage === 'upload') {
      setStage('map');
    } else if (stage === 'map') {
      setStage('verify');
    } else if (stage === 'verify') {
      importContacts();
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
    setFile(selectedFile);
    setColumns(parsedColumns);
    setData(parsedData);
  };

  const prepareDataForImport = () => {
    // Get the mapping of CSV headers to database fields
    const headerToFieldMap = columns.reduce((map, column) => {
      if (column.selected && column.mappedTo) {
        map[column.header] = column.mappedTo;
      }
      return map;
    }, {} as Record<string, string>);

    // Transform the data according to the mapping
    return data.map(row => {
      const transformedRow: Record<string, any> = {
        // Ensure name field has a default value if it's not mapped
        name: 'Imported Contact'
      };
      
      // Apply mappings from CSV to database fields
      Object.keys(headerToFieldMap).forEach(header => {
        const fieldName = headerToFieldMap[header];
        const value = row[header];
        
        // Only add non-empty values
        if (value !== undefined && value !== null && value !== '') {
          transformedRow[fieldName] = value;
        }
      });
      
      // Make sure name is always set
      if (!transformedRow.name || transformedRow.name === '') {
        transformedRow.name = 'Imported Contact';
      }
      
      return transformedRow;
    });
  };

  const importContacts = async () => {
    try {
      setIsImporting(true);
      
      // Prepare data for import
      const contactsToImport = prepareDataForImport();
      
      if (contactsToImport.length === 0) {
        toast({
          title: "No data to import",
          description: "Please select at least one column to import",
          variant: "destructive"
        });
        return;
      }

      // Check if phone number is being mapped
      const hasPhoneMapping = columns.some(col => col.selected && col.mappedTo === 'phone');
      
      if (!hasPhoneMapping) {
        // Regular import without update logic (original behavior)
        const typedContacts = contactsToImport.map(contact => {
          return {
            name: contact.name || 'Imported Contact',
            email: contact.email as string | null,
            phone: contact.phone as string | null,
            company: contact.company as string | null,
            status: contact.status as string | null,
            tags: contact.tags as string[] | null,
            updated_at: new Date().toISOString()
          };
        });
        
        const { error } = await supabase
          .from('contacts')
          .insert(typedContacts);
        
        if (error) throw error;
        
        toast({
          title: "Import successful",
          description: `Successfully imported ${contactsToImport.length} contacts`,
        });
      } else {
        // Import with update logic based on phone numbers
        let created = 0;
        let updated = 0;
        const timestamp = new Date().toISOString();
        
        // Process each contact
        for (const contact of contactsToImport) {
          // Skip entries without phone numbers
          if (!contact.phone) {
            continue;
          }
          
          // Standardize phone format to improve matching (optional)
          const phoneNumber = contact.phone.replace(/\D/g, ''); // Remove non-digits
          
          if (phoneNumber.length < 5) {
            // Skip invalid phone numbers
            continue;
          }
          
          // Check if contact with this phone number already exists
          const { data: existingContacts, error: fetchError } = await supabase
            .from('contacts')
            .select('id, phone')
            .ilike('phone', `%${phoneNumber}%`) // Use ilike for fuzzy matching
            .limit(1);
          
          if (fetchError) {
            console.error('Error checking for existing contact:', fetchError);
            continue;
          }
          
          if (existingContacts && existingContacts.length > 0) {
            // Contact exists - update it
            const contactId = existingContacts[0].id;
            
            // Prepare update data
            const updateData: Record<string, any> = {
              updated_at: timestamp
            };
            
            // Only update non-empty fields
            Object.entries(contact).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                updateData[key] = value;
              }
            });
            
            // Execute update
            const { error: updateError } = await supabase
              .from('contacts')
              .update(updateData)
              .eq('id', contactId);
            
            if (updateError) {
              console.error('Error updating contact:', updateError);
              continue;
            }
            
            updated++;
          } else {
            // Contact doesn't exist - create it
            const newContact = {
              name: contact.name || 'Imported Contact',
              email: contact.email as string | null,
              phone: contact.phone as string | null,
              company: contact.company as string | null,
              status: contact.status as string | null || 'active',
              tags: contact.tags as string[] | null || [],
              created_at: timestamp,
              updated_at: timestamp
            };
            
            const { error: insertError } = await supabase
              .from('contacts')
              .insert(newContact);
            
            if (insertError) {
              console.error('Error creating contact:', insertError);
              continue;
            }
            
            created++;
          }
        }
        
        toast({
          title: "Import successful",
          description: `Created ${created} new contacts and updated ${updated} existing contacts`,
        });
      }
      
      // Call success callback if provided
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      // Reset state
      resetState();
      
    } catch (error: any) {
      console.error('Error importing contacts:', error);
      toast({
        title: "Import failed",
        description: error.message || "An error occurred while importing contacts",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    stage,
    file,
    columns,
    data,
    isImporting,
    setColumns,
    handleClose,
    goToNextStage,
    goToPreviousStage,
    handleFileSelected,
    setStage,
  };
}
