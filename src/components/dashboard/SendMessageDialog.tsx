
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PaperclipIcon, SmileIcon, ZapIcon, SendIcon } from "lucide-react";
import { Contact } from './ContactsTable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendMessageDialogProps {
  open: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
}

const SendMessageDialog: React.FC<SendMessageDialogProps> = ({ 
  open, 
  onClose,
  selectedContacts 
}) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const { toast } = useToast();
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setMessage('');
    }
  }, [open]);

  // Update character and word counts
  useEffect(() => {
    setCharCount(message.length);
    setWordCount(message.trim() ? message.trim().split(/\s+/).length : 0);
  }, [message]);

  const handleSendMessage = async () => {
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter a name for your message template",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message is required",
        description: "Please enter a message body",
        variant: "destructive"
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact to send the message to",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Track successful and failed sends
      let successCount = 0;
      let failedCount = 0;
      
      // Store messages in the messages table and send SMS to each contact
      for (const contact of selectedContacts) {
        if (!contact.phone) {
          console.log(`Skipping contact ${contact.name} - no phone number`);
          failedCount++;
          continue;
        }

        // First, store the message in the database
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            contact_id: contact.id,
            content: message,
            sender: 'user',
            channel: 'sms'
          })
          .select()
          .single();

        if (messageError) {
          console.error("Error storing message:", messageError);
          failedCount++;
          continue;
        }

        // Then send the SMS via the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('send-sms', {
          body: {
            to: contact.phone,
            message: message,
            contactId: contact.id
          }
        });

        if (error) {
          console.error("Error sending SMS:", error);
          failedCount++;
        } else {
          console.log("SMS sent successfully:", data);
          successCount++;
        }
      }

      // Show toast with results
      if (successCount > 0) {
        toast({
          title: "Messages sent",
          description: `Successfully sent to ${successCount} contact${successCount !== 1 ? 's' : ''}${failedCount > 0 ? `, failed to send to ${failedCount}` : ''}`,
          variant: successCount > 0 ? "default" : "destructive"
        });
      } else {
        toast({
          title: "Failed to send messages",
          description: "Could not send messages to any contacts",
          variant: "destructive"
        });
      }

      // Close the dialog
      onClose();
    } catch (error) {
      console.error("Error in send message flow:", error);
      toast({
        title: "Error",
        description: "An error occurred while sending messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create Text Snippet</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left column - Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium flex items-center">
                Name <span className="text-red-500 ml-1">*</span>
              </label>
              <Input 
                id="name"
                placeholder="Enter Snippet Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium flex items-center">
                Snippets Body <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="border rounded-md">
                <div className="flex items-center p-2 border-b">
                  <button className="p-1 rounded hover:bg-gray-100">
                    <SmileIcon size={18} className="text-gray-500" />
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 mx-1">
                    <PaperclipIcon size={18} className="text-gray-500" />
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100">
                    <ZapIcon size={18} className="text-gray-500" />
                  </button>
                </div>
                <Textarea 
                  id="message"
                  placeholder="Type a message" 
                  className="border-0 focus-visible:ring-0 resize-none min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="px-3 py-2 text-xs text-gray-500 text-right">
                  {charCount} characters | {wordCount} words | 0 segs
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="gap-2">
              <PaperclipIcon size={16} />
              Add attachment
            </Button>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Add file through URL</p>
              <div className="flex space-x-2">
                <Input placeholder="Enter URL" className="flex-1" />
                <Button variant="default" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <span className="text-lg font-semibold">+</span>
                  Add
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Test Snippet</p>
              <div className="flex space-x-2">
                <Input placeholder="Enter phone number" className="flex-1" />
                <Button variant="default" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <SendIcon size={16} />
                  Send
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right column - Preview */}
          <div className="flex justify-center items-start">
            <div className="relative w-[280px] h-[540px] bg-black rounded-[36px] p-[12px] shadow-xl overflow-hidden">
              <div className="absolute inset-0 mx-auto w-[66%] h-[4%] top-0 bg-black rounded-b-2xl"></div>
              <div className="bg-white h-full w-full rounded-[24px] overflow-hidden flex flex-col">
                <div className="p-2 text-center text-xs bg-gray-100 flex justify-between items-center">
                  <span>9:41</span>
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-black mr-1"></span>
                    <span className="h-2 w-2 rounded-full bg-black mr-1"></span>
                    <span className="h-2 w-2 rounded-full bg-black"></span>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  {message ? (
                    <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[90%] ml-auto">
                      {message}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Message preview will appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageDialog;
