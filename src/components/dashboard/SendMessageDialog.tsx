
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  PaperclipIcon, 
  SmileIcon, 
  ZapIcon, 
  SendIcon,
  XIcon,
  ImageIcon,
  FileIcon,
  Loader2
} from "lucide-react";
import { Contact } from './ContactsTable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendMessageDialogProps {
  open: boolean;
  onClose: () => void;
  selectedContacts: Contact[];
}

type EmojiData = {
  emoji: string;
  description?: string;
};

// Emoji categories for the picker
const emojiCategories = {
  "Smiles & People": [
    { emoji: "😀", description: "grinning" },
    { emoji: "😁", description: "grinning with smiling eyes" },
    { emoji: "😂", description: "joy" },
    { emoji: "😃", description: "smiley" },
    { emoji: "😄", description: "smile" },
    { emoji: "😅", description: "sweat smile" },
    { emoji: "😆", description: "laughing" },
    { emoji: "😉", description: "wink" },
    { emoji: "😊", description: "blush" },
    { emoji: "😋", description: "yum" },
    { emoji: "😎", description: "sunglasses" },
    { emoji: "😍", description: "heart eyes" },
    { emoji: "😘", description: "kissing heart" },
    { emoji: "🙂", description: "slightly smiling face" },
    { emoji: "🤔", description: "thinking face" },
    { emoji: "😐", description: "neutral face" },
    { emoji: "😒", description: "unamused" },
    { emoji: "😞", description: "disappointed" },
    { emoji: "😔", description: "pensive" },
    { emoji: "😢", description: "cry" },
    { emoji: "😭", description: "sob" },
    { emoji: "😡", description: "rage" },
    { emoji: "😱", description: "scream" },
    { emoji: "😴", description: "sleeping" },
  ],
  "Animals & Nature": [
    { emoji: "🐶", description: "dog" },
    { emoji: "🐱", description: "cat" },
    { emoji: "🐭", description: "mouse" },
    { emoji: "🐹", description: "hamster" },
    { emoji: "🐰", description: "rabbit" },
    { emoji: "🦊", description: "fox" },
    { emoji: "🐻", description: "bear" },
    { emoji: "🐼", description: "panda" },
  ],
  "Food & Drink": [
    { emoji: "🍎", description: "apple" },
    { emoji: "🍐", description: "pear" },
    { emoji: "🍊", description: "tangerine" },
    { emoji: "🍋", description: "lemon" },
    { emoji: "🍌", description: "banana" },
    { emoji: "🍉", description: "watermelon" },
    { emoji: "🍇", description: "grapes" },
    { emoji: "🍓", description: "strawberry" },
  ],
  "Activities": [
    { emoji: "⚽", description: "soccer" },
    { emoji: "🏀", description: "basketball" },
    { emoji: "🏈", description: "football" },
    { emoji: "⚾", description: "baseball" },
    { emoji: "🎾", description: "tennis" },
    { emoji: "🏐", description: "volleyball" },
    { emoji: "🏉", description: "rugby" },
    { emoji: "🎱", description: "8ball" },
  ],
};

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchEmoji, setSearchEmoji] = useState('');
  const [attachments, setAttachments] = useState<{ file: File; url?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName('');
      setMessage('');
      setAttachments([]);
    }
  }, [open]);

  // Update character and word counts
  useEffect(() => {
    setCharCount(message.length);
    setWordCount(message.trim() ? message.trim().split(/\s+/).length : 0);
  }, [message]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-emoji-trigger="true"]')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGenerateAiText = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt is required",
        description: "Please enter a prompt to generate text",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setMessage('');
    
    try {
      // Call the Supabase Edge Function with streaming
      const response = await supabase.functions.invoke('generate-sms', {
        body: { prompt: aiPrompt }
      });
      
      if (!response.data) throw new Error('Failed to generate text');
      
      // Process the streamed response
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let generatedText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                generatedText += parsed.choices[0].delta.content;
                setMessage(generatedText);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
      setShowAiPrompt(false);
      
      toast({
        title: "Text generated",
        description: "AI has generated your text message"
      });
      
    } catch (error) {
      console.error('Error generating text:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate text",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setAiPrompt('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Basic validation - max size 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive"
        });
        return;
      }
      
      // Add file to attachments array
      setAttachments(prev => [...prev, { file }]);
      
      // Upload to Twilio Assets API
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data, error } = await supabase.functions.invoke(
        'upload-twilio-asset',
        {
          body: formData
        }
      );
      
      if (error) throw error;
      
      // Update attachment with URL
      setAttachments(prev => 
        prev.map(att => 
          att.file === file 
            ? { ...att, url: data.mediaUrl } 
            : att
        )
      );
      
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      // Remove failed attachment
      setAttachments(prev => prev.filter(att => att.file !== file));
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const filteredEmojis = searchEmoji 
    ? Object.values(emojiCategories).flat().filter(emoji => 
        emoji.description?.toLowerCase().includes(searchEmoji.toLowerCase())
      )
    : null;

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

        // Prepare the message payload with attachments if any
        const messagePayload: any = {
          to: contact.phone,
          message: message,
          contactId: contact.id
        };

        // Add media URLs if attachments exist
        if (attachments.length > 0) {
          const mediaUrls = attachments
            .filter(att => att.url)
            .map(att => att.url);
            
          if (mediaUrls.length > 0) {
            messagePayload.mediaUrls = mediaUrls;
          }
        }

        // Send the SMS via the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('send-sms', {
          body: messagePayload
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

  const renderFilePreview = (file: File) => {
    const isImage = file.type.startsWith('image/');
    
    return (
      <div className="flex items-center bg-gray-100 rounded-md p-2 mb-2">
        {isImage ? (
          <ImageIcon size={16} className="text-gray-500 mr-2" />
        ) : (
          <FileIcon size={16} className="text-gray-500 mr-2" />
        )}
        <span className="text-sm truncate flex-1">{file.name}</span>
        <button 
          onClick={() => removeAttachment(attachments.findIndex(a => a.file === file))}
          className="p-1 hover:bg-gray-200 rounded-full"
        >
          <XIcon size={14} className="text-gray-500" />
        </button>
      </div>
    );
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
                  <button 
                    type="button"
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    data-emoji-trigger="true"
                  >
                    <SmileIcon size={18} className="text-gray-500" />
                  </button>
                  <button 
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 mx-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PaperclipIcon size={18} className="text-gray-500" />
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                    />
                  </button>
                  <Popover open={showAiPrompt} onOpenChange={setShowAiPrompt}>
                    <PopoverTrigger asChild>
                      <button 
                        className={`p-1 rounded hover:bg-gray-100 ${showAiPrompt ? 'bg-gray-100' : ''}`}
                        aria-label="Generate text with AI"
                      >
                        <ZapIcon size={18} className={showAiPrompt ? "text-indigo-600" : "text-gray-500"} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-4">
                        <h4 className="font-medium">Generate SMS with AI</h4>
                        <p className="text-sm text-gray-500">
                          Describe what you want the AI to generate. The text will be optimized for SMS (140 characters).
                        </p>
                        <Textarea
                          placeholder="E.g., 'Create a promotional SMS for a 20% off sale on summer clothing'"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          className="min-h-[100px]"
                          disabled={isGenerating}
                        />
                        <Button 
                          onClick={handleGenerateAiText}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          disabled={isGenerating || !aiPrompt.trim()}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <ZapIcon className="mr-2 h-4 w-4" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div 
                      ref={emojiPickerRef}
                      className="absolute top-[110px] left-6 bg-white border rounded-md shadow-lg z-50 w-64"
                    >
                      <div className="p-2 border-b">
                        <div className="flex space-x-1 mb-2 overflow-x-auto">
                          {Object.keys(emojiCategories).slice(0, 4).map(category => {
                            const firstEmoji = emojiCategories[category as keyof typeof emojiCategories][0].emoji;
                            return (
                              <button 
                                key={category}
                                className="p-1 hover:bg-gray-100 rounded"
                                title={category}
                              >
                                {firstEmoji}
                              </button>
                            );
                          })}
                        </div>
                        <Input 
                          placeholder="Search emoji" 
                          value={searchEmoji}
                          onChange={(e) => setSearchEmoji(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto p-2">
                        {filteredEmojis ? (
                          <>
                            <div className="text-xs font-medium text-gray-500 mb-1">Search Results</div>
                            <div className="grid grid-cols-8 gap-1">
                              {filteredEmojis.map((emoji, i) => (
                                <button
                                  key={i}
                                  className="p-1 text-xl hover:bg-gray-100 rounded"
                                  onClick={() => handleEmojiClick(emoji.emoji)}
                                  title={emoji.description}
                                >
                                  {emoji.emoji}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          Object.entries(emojiCategories).map(([category, emojis]) => (
                            <div key={category} className="mb-3">
                              <div className="text-xs font-medium text-gray-500 mb-1">{category}</div>
                              <div className="grid grid-cols-8 gap-1">
                                {emojis.map((emoji, i) => (
                                  <button
                                    key={i}
                                    className="p-1 text-xl hover:bg-gray-100 rounded"
                                    onClick={() => handleEmojiClick(emoji.emoji)}
                                    title={emoji.description}
                                  >
                                    {emoji.emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Textarea 
                  id="message"
                  placeholder="Type a message" 
                  className="border-0 focus-visible:ring-0 resize-none min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="px-3 py-2 text-xs text-gray-500 text-right">
                  {charCount} characters | {wordCount} words | {Math.ceil(charCount / 160)} segs
                </div>
              </div>
            </div>
            
            {isGenerating && (
              <div className="flex items-center justify-center space-x-2 text-sm text-indigo-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI is generating your text...</span>
              </div>
            )}
            
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attachments</p>
                <div className="space-y-1">
                  {attachments.map((att, index) => (
                    <div key={index} className="relative">
                      {renderFilePreview(att.file)}
                      {!att.url && uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon size={16} />
              Add attachment
            </Button>
            
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
                      {attachments.length > 0 && (
                        <div className="mt-1 text-xs text-blue-100">
                          {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                        </div>
                      )}
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
          <Button 
            variant="default" 
            onClick={handleSendMessage} 
            className="gap-2 bg-indigo-600 hover:bg-indigo-700" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <SendIcon size={16} />
                <span>Send</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageDialog;
