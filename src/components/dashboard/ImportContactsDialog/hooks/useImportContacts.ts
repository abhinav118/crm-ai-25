import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logContactAction } from '@/utils/contactLogger';
import { Contact } from '@/components/dashboard/ContactsTable';
import { syncContactToSegment } from '@/utils/segmentSync';

interface MappedContact {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  tags?: string[];
  segment_name?: string;
}

interface ImportResult {
  success: boolean;
  contact?: Contact;
  error?: string;
  originalData: MappedContact;
}

export const useImportContacts = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const { toast } = useToast();

  const resetState = () => {
    setIsImporting(false);
    setImportProgress(0);
    setImportResults([]);
  };

  const processContacts = async (
    mappedContacts: MappedContact[],
    onProgress?: (progress: number) => void
  ) => {
    const batchSize = 50;
    const results: ImportResult[] = [];
    let processed = 0;

    for (let i = 0; i < mappedContacts.length; i += batchSize) {
      const batch = mappedContacts.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (contact) => {
          try {
            const contactData = {
              first_name: contact.first_name,
              last_name: contact.last_name || null,
              email: contact.email || null,
              phone: contact.phone || null,
              company: contact.company || null,
              status: (contact.status as 'active' | 'inactive') || 'active',
              tags: contact.tags || [],
              segment_name: contact.segment_name || 'UNASSIGNED',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: newContact, error } = await supabase
              .from('contacts')
              .insert([contactData])
              .select()
              .single();

            if (error) throw error;

            // Sync the new contact to its segment
            try {
              await syncContactToSegment(newContact);
            } catch (syncError) {
              console.error('Failed to sync contact to segment:', syncError);
              // Don't fail the import if segment sync fails
            }

            // Log the import action
            await logContactAction('add', newContact);

            return {
              success: true,
              contact: newContact,
              originalData: contact
            };
          } catch (error) {
            console.error('Error importing contact:', error);
            return {
              success: false,
              error: error.message,
              originalData: contact
            };
          }
        })
      );

      // Process batch results
      batchResults.forEach((result, index) => {
        const originalContact = batch[index];
        if (result.status === 'fulfilled') {
          results.push({
            success: result.value.success,
            contact: result.value.contact,
            error: result.value.error,
            originalData: originalContact
          });
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            originalData: originalContact
          });
        }
      });

      processed += batch.length;
      onProgress?.(Math.round((processed / mappedContacts.length) * 100));

      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < mappedContacts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  };

  const importContacts = async (
    mappedContacts: MappedContact[],
    onProgress?: (progress: number) => void
  ) => {
    setIsImporting(true);
    setImportProgress(0);
    setImportResults([]);

    try {
      const results = await processContacts(mappedContacts, onProgress);
      setImportResults(results);

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: 'Contacts imported',
          description: `${successCount} contacts imported successfully.`,
        });
      }

      if (errorCount > 0) {
        toast({
          title: 'Import errors',
          description: `${errorCount} contacts failed to import. See results for details.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error during contact import:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'An error occurred during contact import.',
        variant: 'destructive',
      });
      setImportResults([{ success: false, error: error.message, originalData: {} as MappedContact }]);
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    importProgress,
    importResults,
    importContacts,
    resetState
  };
};
