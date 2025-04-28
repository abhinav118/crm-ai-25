
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type GenerationType = 
  | 'sms' 
  | 'email' 
  | 'email_subject' 
  | 'blog' 
  | 'blog_header' 
  | 'blog_layout' 
  | 'image';

export const useAiGeneration = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateContent = async (prompt: string, type: GenerationType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await supabase.functions.invoke('ai-generation', {
        body: { prompt, type }
      });

      if (apiError) {
        throw new Error(apiError.message || 'Failed to generate content');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setIsLoading(false);
      return data.result;
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setError(err.message || 'An unexpected error occurred');
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate content',
        variant: 'destructive',
      });
      setIsLoading(false);
      return null;
    }
  };

  return { generateContent, isLoading, error };
};
