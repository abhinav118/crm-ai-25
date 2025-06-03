
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  PaperclipIcon, 
  SmileIcon, 
  ZapIcon,
  SendIcon,
  XIcon,
  ImageIcon,
  FileIcon,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { PromptInput, PromptInputActions, PromptInputTextarea } from '@/components/ui/prompt-input';
import Sidebar from '@/components/dashboard/Sidebar';

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

// Message prompt suggestions
const MESSAGE_SUGGESTIONS = [
  "Thanks for reaching out! How can I help you today?",
  "We received your inquiry and will get back to you shortly.",
  "Your appointment is confirmed for tomorrow at 2 PM.",
  "Just following up on our conversation. Any updates?",
  "Happy birthday! 🎂 We've got a special offer just for you.",
  "Your order has been shipped and will arrive in 2-3 business days.",
  "Thank you for your purchase! Here's your receipt.",
  "We miss you! Come back and enjoy 15% off your next purchase."
];

const AI_PROMPT_SUGGESTIONS = [
  "Create a friendly welcome message",
  "Write a professional follow-up",
  "Generate a sales promotion announcement",
  "Craft a birthday greeting with discount offer",
  "Write a shipping confirmation message",
  "Create a customer satisfaction survey request"
];

const CreateCampaignPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toField, setToField] = useState('');
  const [senderName, setSenderName] = useState('Angel Flight Marketing Service');
  const [message, setMessage] = useState('');
  const [scheduleOption, setScheduleOption] = useState('send_now');
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchEmoji, setSearchEmoji] = useState('');
  const [attachments, setAttachments] = useState<{ file: File; url?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Update character count
  useEffect(() => {
    setCharCount(message.length);
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

  const handleSendCampaign = async () => {
    if (!toField.trim()) {
      toast({
        title: "Recipients required",
        description: "Please enter phone numbers, contacts, or groups",
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

    setIsLoading(true);

    try {
      console.log('Sending campaign:', { 
        to: toField, 
        senderName, 
        message, 
        scheduleOption, 
        attachments 
      });
      
      toast({
        title: "Campaign sent",
        description: "Your campaign has been sent successfully",
      });

      navigate('/campaigns');
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast({
        title: "Error",
        description: "An error occurred while sending the campaign",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter what kind of message you'd like to generate",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAI(true);

    try {
      console.log("Calling Supabase function with prompt:", aiPrompt);
      
      const { data, error } = await supabase.functions.invoke('generate-sms', {
        body: { prompt: aiPrompt }
      });
      
      if (error) {
        console.error("Error calling function:", error);
        throw new Error(`Failed to generate text: ${error.message}`);
      }
      
      if (!data) {
        console.error("Failed to generate text - no data in response");
        throw new Error('Failed to generate text - no response data');
      }
      
      // Check if data is a ReadableStream
      if (data.constructor && data.constructor.name === 'ReadableStream') {
        console.log("Received stream response");
        const reader = data.getReader();
        let generatedText = '';
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          try {
            const chunk = decoder.decode(value, { stream: true });
            console.log("Received chunk:", chunk);
            
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.substring(5).trim();
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices && parsed.choices[0]?.delta?.content) {
                    generatedText += parsed.choices[0].delta.content;
                    setMessage(generatedText);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e, 'Raw data:', data);
                }
              }
            }
          } catch (decodeError) {
            console.error('Error decoding chunk:', decodeError);
          }
        }
      } else {
        // Handle non-streaming response
        console.log("Received non-stream response:", data);
        if (typeof data === 'string') {
          setMessage(data);
        } else if (data.text || data.content || data.message) {
          setMessage(data.text || data.content || data.message);
        } else {
          console.error("Unexpected data format:", data);
          throw new Error('Unexpected response format from AI generation');
        }
      }
      
      setShowPromptInput(false);
      setAiPrompt('');
      
      toast({
        title: "Message generated",
        description: "AI-generated message has been created",
      });
    } catch (error) {
      console.error("Error generating message:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate message",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
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

  const segmentCount = Math.ceil(charCount / 160);

  return (
    <div className="flex w-full">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Back Navigation */}
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/campaigns')}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Panel - Form */}
            <div className="space-y-6">
              {/* TO Field */}
              <div className="space-y-2">
                <Label htmlFor="to" className="text-sm font-medium text-gray-700">
                  TO
                </Label>
                <Input 
                  id="to"
                  placeholder="Enter numbers, contacts, or groups" 
                  value={toField}
                  onChange={(e) => setToField(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Message contacts and replies are only visible to you
                </p>
              </div>

              {/* MESSAGE Section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  MESSAGE
                </Label>
                
                {/* Sender Name */}
                <div>
                  <Input 
                    placeholder="Sender Name" 
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full mb-3"
                  />
                </div>

                {/* Message Text Area with Controls */}
                <div className="border rounded-md">
                  <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <button 
                        type="button"
                        className="p-1 rounded hover:bg-gray-200"
                        onClick={() => setShowPromptInput(!showPromptInput)}
                        title="AI Compose"
                      >
                        <ZapIcon size={18} className={showPromptInput ? "text-indigo-500" : "text-gray-500"} />
                      </button>
                      <button 
                        type="button"
                        className="p-1 rounded hover:bg-gray-200"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        data-emoji-trigger="true"
                        title="Add Emoji"
                      >
                        <SmileIcon size={18} className="text-gray-500" />
                      </button>
                      <button 
                        type="button"
                        className="p-1 rounded hover:bg-gray-200"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach File"
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
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {charCount} / 160 
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        SMS
                      </span>
                    </div>
                  </div>

                  {/* AI Prompt Input */}
                  {showPromptInput && (
                    <div className="p-3 border-b bg-slate-50">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {AI_PROMPT_SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
                            <PromptSuggestion 
                              key={index}
                              size="sm"
                              variant="outline" 
                              onClick={() => setAiPrompt(suggestion)}
                              className="text-xs py-1"
                            >
                              {suggestion}
                            </PromptSuggestion>
                          ))}
                        </div>
                        <PromptInput
                          className="border-input bg-white"
                          value={aiPrompt}
                          onValueChange={setAiPrompt}
                          onSubmit={handleGenerateWithAI}
                        >
                          <PromptInputTextarea placeholder="Describe the message you want to generate..." />
                          <PromptInputActions className="justify-end">
                            <Button
                              size="sm"
                              className="size-8 cursor-pointer rounded-full"
                              onClick={handleGenerateWithAI}
                              disabled={!aiPrompt.trim() || isGeneratingAI}
                              aria-label="Generate"
                            >
                              {isGeneratingAI ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <ZapIcon className="h-3 w-3" />
                              )}
                            </Button>
                          </PromptInputActions>
                        </PromptInput>
                      </div>
                    </div>
                  )}

                  <Textarea 
                    placeholder="Type your message" 
                    className="border-0 focus-visible:ring-0 resize-none min-h-[120px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div 
                      ref={emojiPickerRef}
                      className="absolute z-50 bg-white border rounded-md shadow-lg w-64 mt-1"
                    >
                      <div className="p-2 border-b">
                        <Input 
                          placeholder="Search emoji" 
                          value={searchEmoji}
                          onChange={(e) => setSearchEmoji(e.target.value)}
                          className="w-full text-sm"
                        />
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto p-2">
                        {filteredEmojis ? (
                          <div className="grid grid-cols-8 gap-1">
                            {filteredEmojis.map((emoji, i) => (
                              <button
                                key={i}
                                className="p-1 text-lg hover:bg-gray-100 rounded"
                                onClick={() => handleEmojiClick(emoji.emoji)}
                                title={emoji.description}
                              >
                                {emoji.emoji}
                              </button>
                            ))}
                          </div>
                        ) : (
                          Object.entries(emojiCategories).slice(0, 2).map(([category, emojis]) => (
                            <div key={category} className="mb-2">
                              <div className="text-xs font-medium text-gray-500 mb-1">{category}</div>
                              <div className="grid grid-cols-8 gap-1">
                                {emojis.slice(0, 16).map((emoji, i) => (
                                  <button
                                    key={i}
                                    className="p-1 text-lg hover:bg-gray-100 rounded"
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

                {/* Character Counter */}
                <p className="text-sm text-gray-500">
                  {charCount} / 160 characters • {segmentCount} segment{segmentCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="space-y-2">
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
              )}

              {/* Schedule Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  SCHEDULE
                </Label>
                <RadioGroup value={scheduleOption} onValueChange={setScheduleOption}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="send_now" id="send_now" />
                    <Label htmlFor="send_now" className="font-normal">Send Now</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="schedule_later" id="schedule_later" />
                    <Label htmlFor="schedule_later" className="font-normal">Schedule for Later</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="schedule_recurring" id="schedule_recurring" />
                    <Label htmlFor="schedule_recurring" className="font-normal">Schedule Recurring</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Credit Info */}
              <p className="text-sm text-gray-500">
                Message will be sent as SMS at <strong>1 CREDIT</strong> per contact.{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700">Learn more</a>
              </p>

              {/* Send Button */}
              <Button 
                onClick={handleSendCampaign} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send</span>
                )}
              </Button>
            </div>
            
            {/* Right Panel - Phone Preview */}
            <div className="flex justify-center">
              <div className="bg-blue-600 rounded-3xl p-3 w-72 h-96">
                <div className="bg-white h-full w-full rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-3 text-center text-xs bg-gray-100 flex justify-between items-center">
                    <span>9:41</span>
                    <div className="flex items-center space-x-1">
                      <div className="h-1 w-1 rounded-full bg-black"></div>
                      <div className="h-1 w-1 rounded-full bg-black"></div>
                      <div className="h-1 w-1 rounded-full bg-black"></div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="text-center text-xs text-gray-500 mb-2">
                      (952) 248-4727
                    </div>
                    <div className="space-y-2">
                      {message ? (
                        <div className="bg-gray-200 text-gray-900 p-3 rounded-lg max-w-[85%]">
                          <div className="text-xs text-gray-600 mb-1">
                            ({senderName}) STOP to end
                          </div>
                          <div>{message}</div>
                          {attachments.length > 0 && (
                            <div className="mt-1 text-xs text-gray-600">
                              📎 {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                          Message preview will appear here
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
