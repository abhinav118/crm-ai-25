import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  PaperclipIcon, 
  SmileIcon, 
  ZapIcon,
  Loader2,
  ChevronLeft,
  CalendarIcon,
  Clock,
  Info,
  X,
  ImageIcon
} from 'lucide-react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { PromptInput, PromptInputActions, PromptInputTextarea } from '@/components/ui/prompt-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/dashboard/Sidebar';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

// Sample audience segments for the dropdown
const sampleSegments = [
  "All Contacts",
  "VIP Customers", 
  "New Subscribers",
  "Birthday Club Members",
  "Frequent Buyers",
  "Inactive Customers",
  "Location: Downtown",
  "Location: Suburbs",
  "Age: 18-25",
  "Age: 26-35",
  "Age: 36-50"
];

// Sample campaign data for pre-population
const sampleCampaignData = {
  '1': {
    id: '1',
    name: 'June Flash Deal',
    message: '🔥 Don\'t miss our Flash Deal! Get 50% off everything until midnight. Use code FLASH50 🛍️',
    to: 'VIP Customers',
    scheduledFor: '2025-06-14T08:00',
    scheduleType: 'schedule_later'
  },
  '2': {
    id: '2',
    name: 'Summer Sale Blast',
    message: 'Hey {{first_name}}! ☀️ Summer sale is here - Up to 70% off on summer collection. Limited time offer!',
    to: 'All Contacts',
    scheduledFor: '2025-06-18T10:30',
    scheduleType: 'schedule_later'
  },
  '3': {
    id: '3',
    name: 'Father\'s Day Special',
    message: 'Celebrate Dad with our special Father\'s Day menu! 👨‍👩‍👧‍👦 Book your table now for June 15th.',
    to: 'Family Diners',
    scheduledFor: '2025-06-15T09:00',
    scheduleType: 'schedule_later'
  }
};

// Updated AI prompt suggestions for better SMS generation
const AI_PROMPT_SUGGESTIONS = [
  "Create a friendly welcome message for new customers",
  "Write a flash sale announcement with urgency",
  "Generate a birthday greeting with discount offer",
  "Craft a professional follow-up message",
  "Create a holiday special promotion",
  "Write a customer satisfaction survey request"
];

// Days of the week for recurring campaigns
const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const CreateCampaignPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleType, setScheduleType] = useState<'now' | 'later' | 'recurring'>('now');
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPersonalizationTags, setShowPersonalizationTags] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [calendarInfo, setCalendarInfo] = useState<string | null>(null);
  
  // Image attachment states
  const [attachedImage, setAttachedImage] = useState<{name: string, url: string, file: File} | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Schedule Later fields
  const [scheduleTime, setScheduleTime] = useState<Date>();
  
  // Schedule Recurring fields
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [recurringStartTime, setRecurringStartTime] = useState<Date>(new Date());
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recipientInputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const personalizationRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Personalization tags with display names and corresponding template tags
  const personalizationOptions = [
    { label: 'First Name', tag: '{{first_name}}' },
    { label: 'Last Name', tag: '{{last_name}}' },
    { label: 'Company', tag: '{{company}}' }
  ];

  // Filter segments based on search query
  const filteredSegments = sampleSegments.filter(segment =>
    segment.toLowerCase().includes(recipientInput.toLowerCase())
  );

  // Handle URL parameters and prefilled data
  useEffect(() => {
    const scheduleFor = searchParams.get('scheduleFor');
    const fromCampaignId = searchParams.get('fromCampaignId');

    // Handle schedule for parameter (from calendar day click)
    if (scheduleFor) {
      const scheduleDate = new Date(scheduleFor);
      
      // Check if date is in the past, if so, set to today + 1 hour
      const now = new Date();
      const targetDate = scheduleDate < now ? new Date(now.getTime() + 60 * 60 * 1000) : scheduleDate;
      
      setScheduleType('later');
      setScheduleTime(targetDate);
      
      setCalendarInfo(`Scheduled from calendar for ${format(targetDate, 'MMMM d, yyyy')}`);
    }

    // Handle campaign ID parameter (from "View Campaign" button)
    if (fromCampaignId && sampleCampaignData[fromCampaignId as keyof typeof sampleCampaignData]) {
      const campaign = sampleCampaignData[fromCampaignId as keyof typeof sampleCampaignData];
      
      setCampaignName(campaign.name);
      setMessage(campaign.message);
      setRecipientInput(campaign.to);
      
      if (campaign.scheduleType === 'schedule_later') {
        const campaignDate = new Date(campaign.scheduledFor);
        setScheduleType('later');
        setScheduleTime(campaignDate);
      }
      
      // Scroll to message area after a brief delay
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        messageRef.current?.focus();
      }, 100);
    }

    // Handle prefilled message from navigation state (existing functionality)
    if (location.state?.prefilledMessage && !fromCampaignId) {
      setMessage(location.state.prefilledMessage);
      if (location.state?.campaignName) {
        setCampaignName(`${location.state.campaignName} - Copy`);
      }
      
      // Scroll to message area after a brief delay
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        messageRef.current?.focus();
      }, 100);
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    setCharCount(message.length);
    setWordCount(message.trim() ? message.trim().split(/\s+/).length : 0);
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSegmentDropdown(false);
      }
      if (personalizationRef.current && !personalizationRef.current.contains(event.target as Node)) {
        setShowPersonalizationTags(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRecipientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipientInput(value);
    setShowSegmentDropdown(value.length > 0);
  };

  const handleSegmentSelect = (segment: string) => {
    setRecipientInput(segment);
    setShowSegmentDropdown(false);
    recipientInputRef.current?.blur();
  };

  const handleAddRecipient = () => {
    if (recipientInput.trim()) {
      // Check if it's a phone number or segment
      if (recipientInput.match(/^\+?\d{10,15}$/)) {
        // It's a phone number
        if (!recipients.includes(recipientInput.trim())) {
          setRecipients([...recipients, recipientInput.trim()]);
        }
      } else {
        // It's a segment, add it as is
        if (!recipients.includes(recipientInput.trim())) {
          setRecipients([...recipients, recipientInput.trim()]);
        }
      }
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: any) => {
    const newMessage = insertAtCursor(message, emoji.native);
    setMessage(newMessage);
    setShowEmojiPicker(false);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please select a PNG or JPEG image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (1MB = 1024 * 1024 bytes)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 1MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert file to base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/xxx;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('Calling upload-to-cloudinary edge function...');
      
      // Call the Supabase Edge Function to upload to Cloudinary
      const { data, error } = await supabase.functions.invoke('upload-to-cloudinary', {
        body: { base64Image: base64String }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to upload image');
      }

      if (!data?.media_url) {
        throw new Error('No media URL returned from upload');
      }

      // Set attached image
      setAttachedImage({
        name: file.name,
        url: data.media_url,
        file: file
      });

      toast({
        title: "Image uploaded",
        description: `${file.name} has been attached to your message`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePersonalizationTag = (tag: string) => {
    const newMessage = insertAtCursor(message, tag);
    setMessage(newMessage);
    setShowPersonalizationTags(false);
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
      console.log('Calling create-ai-sms-text with prompt:', aiPrompt);
      
      const { data, error } = await supabase.functions.invoke('create-ai-sms-text', {
        body: { prompt: aiPrompt }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data?.message) {
        setMessage(data.message);
        setShowPromptInput(false);
        setAiPrompt('');
        
        toast({
          title: "Message generated",
          description: "AI-generated SMS message has been created",
        });

        // Auto-scroll to message preview after generation
        setTimeout(() => {
          messageRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      } else {
        throw new Error('No message returned from AI');
      }
    } catch (error) {
      console.error("Error generating message:", error);
      toast({
        title: "Couldn't generate SMS",
        description: "Try again with a different prompt",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendCampaign = async () => {
    if (recipients.length === 0) {
      toast({
        title: "Recipients required",
        description: "Please add at least one recipient or audience segment",
        variant: "destructive"
      });
      return;
    }

    if (!campaignName.trim()) {
      toast({
        title: "Campaign name is required",
        description: "Please enter a campaign name",
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

    if (scheduleType === 'later' && !scheduleTime) {
      toast({
        title: "Schedule time required",
        description: "Please select a time for scheduled delivery",
        variant: "destructive"
      });
      return;
    }

    if (scheduleType === 'recurring' && repeatDays.length === 0) {
      toast({
        title: "Repeat days required",
        description: "Please select at least one day for recurring campaigns",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save campaign to database
      const campaignData = {
        campaign_name: campaignName,
        message: message,
        recipients: recipients,
        schedule_type: scheduleType,
        schedule_time: scheduleType === 'later' ? scheduleTime?.toISOString() : null,
        repeat_frequency: scheduleType === 'recurring' ? repeatFrequency : null,
        repeat_days: scheduleType === 'recurring' ? repeatDays : null,
        status: scheduleType === 'now' ? 'pending' : 'scheduled',
        media_url: attachedImage?.url || null
      };

      console.log('Saving campaign:', campaignData);
      
      const { data: campaign, error: campaignError } = await supabase
        .from('telnyx_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (campaignError) {
        throw campaignError;
      }

      // Send SMS/MMS via updated send-via-telnyx function
      const phoneRecipients = recipients.filter(recipient => 
        recipient.match(/^\+?\d{10,15}$/)
      ).map(recipient => 
        recipient.startsWith('+') ? recipient : `+1${recipient.replace(/\D/g, '')}`
      );

      if (phoneRecipients.length > 0) {
        try {
          const { data, error } = await supabase.functions.invoke('send-via-telnyx', {
            body: {
              to: phoneRecipients,
              message: message,
              media_url: attachedImage?.url || null,
              schedule_type: scheduleType,
              schedule_time: scheduleType === 'later' ? scheduleTime?.toISOString() : undefined
            }
          });

          if (error) throw error;

          // Update campaign status based on response
          let finalStatus = 'sent';
          if (scheduleType === 'later') {
            finalStatus = 'scheduled';
          } else if (data?.failed_count > 0) {
            finalStatus = 'failed';
          }

          await supabase
            .from('telnyx_campaigns')
            .update({ status: finalStatus })
            .eq('id', campaign.id);

          if (scheduleType === 'later') {
            toast({
              title: "Campaign scheduled",
              description: `${phoneRecipients.length} ${attachedImage ? 'MMS' : 'SMS'} message(s) scheduled for ${format(scheduleTime!, 'PPP p')}`,
            });
          } else if (data?.failed_count > 0) {
            toast({
              title: "Campaign partially sent",
              description: `${data.sent_count} sent, ${data.failed_count} failed`,
              variant: "destructive"
            });
          } else {
            toast({
              title: "Campaign sent successfully",
              description: `${data.sent_count} ${attachedImage ? 'MMS' : 'SMS'} message(s) sent successfully`,
            });
          }
        } catch (error) {
          console.error("Error sending campaign:", error);
          await supabase
            .from('telnyx_campaigns')
            .update({ status: 'failed' })
            .eq('id', campaign.id);

          toast({
            title: "Error sending campaign",
            description: error.message || "An error occurred while sending the campaign",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Campaign saved",
          description: "Campaign saved but no valid phone numbers found to send to",
        });
      }

      navigate('/campaigns');
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing the campaign",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSmsSegments = () => Math.ceil(charCount / 160);

  const handleDayToggle = (day: string) => {
    setRepeatDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const insertAtCursor = (text: string, insert: string) => {
    if (!messageRef.current) return text;
    
    const textarea = messageRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = text.substring(0, start) + insert + text.substring(end);
    
    // Update cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insert.length, start + insert.length);
    }, 0);
    
    return newText;
  };

  return (
    <TooltipProvider>
      <div className="flex w-full">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 max-w-6xl mx-auto px-4 py-6">
            
            {/* Left Panel - Form */}
            <div className="space-y-6">
              {/* Back to Campaigns */}
              <Link to="/campaigns" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Campaigns
              </Link>

              <h1 className="text-2xl font-semibold">Create Campaign</h1>
              
              {/* Calendar Info Alert */}
              {calendarInfo && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    {calendarInfo}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Recipients Field */}
              <div className="space-y-2">
                <Label htmlFor="recipients" className="text-sm font-medium">
                  Recipients <span className="text-red-500">*</span>
                </Label>
                <div className="relative" ref={dropdownRef}>
                  <div className="flex gap-2">
                    <Input 
                      ref={recipientInputRef}
                      id="recipients"
                      placeholder="Enter phone numbers (+1234567890) or segments" 
                      value={recipientInput}
                      onChange={handleRecipientInputChange}
                      onFocus={() => setShowSegmentDropdown(recipientInput.length > 0)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                    />
                    <Button type="button" onClick={handleAddRecipient} variant="outline">
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter phone numbers or select audience segments
                  </p>
                  
                  {/* Recipients List */}
                  {recipients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {recipients.map((recipient, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                          {recipient}
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(index)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showSegmentDropdown && filteredSegments.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {filteredSegments.map((segment, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleSegmentSelect(segment)}
                        >
                          {segment}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="campaign-name" className="text-sm font-medium">
                  Campaign Name <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="campaign-name"
                  placeholder="e.g., Flash Sale Campaign" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              {/* Message Text */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">
                  Message <span className="text-red-500">*</span>
                </Label>

                <div className="border rounded-md relative">
                  <div className="flex items-center p-2 border-b bg-gray-50 gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button"
                          className="p-1 rounded hover:bg-gray-100"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          aria-label="Insert emoji"
                        >
                          <SmileIcon size={18} className="text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Insert emoji</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button"
                          className={`p-1 rounded hover:bg-gray-100 ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={handleFileAttach}
                          disabled={isUploadingImage}
                          aria-label="Attach image"
                        >
                          {isUploadingImage ? (
                            <Loader2 size={18} className="text-gray-500 animate-spin" />
                          ) : (
                            <PaperclipIcon size={18} className="text-gray-500" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Attach image (PNG/JPEG, max 1MB)</TooltipContent>
                    </Tooltip>

                    <div className="relative" ref={personalizationRef}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            type="button"
                            className="p-1 rounded hover:bg-gray-100"
                            onClick={() => setShowPersonalizationTags(!showPersonalizationTags)}
                            aria-label="Personalize"
                          >
                            <span className="text-gray-500 font-mono text-sm">{'{}'}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Insert merge tag</TooltipContent>
                      </Tooltip>
                      
                      {showPersonalizationTags && (
                        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px]">
                          {personalizationOptions.map((option) => (
                            <button
                              key={option.tag}
                              onClick={() => handlePersonalizationTag(option.tag)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button"
                          className="p-1 rounded hover:bg-gray-100"
                          onClick={() => setShowPromptInput(!showPromptInput)}
                          aria-label="AI Compose"
                        >
                          <ZapIcon size={18} className={showPromptInput ? "text-indigo-500" : "text-gray-500"} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>AI compose builder</TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 z-50 mt-1">
                      <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="light"
                        previewPosition="none"
                        skinTonePosition="none"
                      />
                    </div>
                  )}
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  
                  {/* AI prompt input section */}
                  {showPromptInput && (
                    <div className="p-3 border-b bg-slate-50">
                      <h4 className="text-sm font-medium mb-2">AI Compose</h4>
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
                    ref={messageRef}
                    id="message"
                    placeholder="Type your message here..." 
                    className="border-0 focus-visible:ring-0 resize-none min-h-[120px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={160}
                  />
                  
                  {/* Attached Image Display */}
                  {attachedImage && (
                    <div className="px-3 py-3 border-t bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded border overflow-hidden bg-white">
                            <img 
                              src={attachedImage.url} 
                              alt={attachedImage.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachedImage.name}</p>
                            <p className="text-xs text-gray-500">Image attached • Will send as MMS</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 flex justify-between">
                    <span>{charCount} / 160 characters</span>
                    <span>{attachedImage ? 'MMS' : `${getSmsSegments()} SMS segment${getSmsSegments() !== 1 ? 's' : ''}`}</span>
                  </div>
                </div>
              </div>

              {/* Schedule Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Schedule</Label>
                <RadioGroup value={scheduleType} onValueChange={(value) => setScheduleType(value as 'now' | 'later' | 'recurring')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="now" id="send_now" />
                    <Label htmlFor="send_now" className="text-sm">Send Now</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="later" id="schedule_later" />
                    <Label htmlFor="schedule_later" className="text-sm">Schedule for Later</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recurring" id="schedule_recurring" />
                    <Label htmlFor="schedule_recurring" className="text-sm">Schedule Recurring</Label>
                  </div>
                </RadioGroup>

                {/* Schedule for Later */}
                {scheduleType === 'later' && (
                  <div className="mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Date & Time</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduleTime && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduleTime ? format(scheduleTime, "PPP p") : <span>Pick a date and time</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduleTime}
                            onSelect={setScheduleTime}
                            initialFocus
                            className="pointer-events-auto"
                          />
                          <div className="p-3 border-t">
                            <Input
                              type="datetime-local"
                              value={scheduleTime ? format(scheduleTime, "yyyy-MM-dd'T'HH:mm") : ''}
                              onChange={(e) => setScheduleTime(new Date(e.target.value))}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Schedule Recurring */}
                {scheduleType === 'recurring' && (
                  <div className="mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Repeat Frequency</Label>
                      <Select value={repeatFrequency} onValueChange={(value) => setRepeatFrequency(value as 'daily' | 'weekly' | 'monthly')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {repeatFrequency === 'weekly' && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Repeat on Days</Label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={day}
                                checked={repeatDays.includes(day)}
                                onCheckedChange={() => handleDayToggle(day)}
                              />
                              <Label htmlFor={day} className="text-sm">{day.slice(0, 3)}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Start Date & Time</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(recurringStartTime, "PPP p")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={recurringStartTime}
                            onSelect={(date) => setRecurringStartTime(date || new Date())}
                            initialFocus
                            className="pointer-events-auto"
                          />
                          <div className="p-3 border-t">
                            <Input
                              type="datetime-local"
                              value={format(recurringStartTime, "yyyy-MM-dd'T'HH:mm")}
                              onChange={(e) => setRecurringStartTime(new Date(e.target.value))}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>

              {/* Send Campaign Button */}
              <Button 
                onClick={handleSendCampaign} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>
                      {scheduleType === 'now' ? 'Sending Campaign...' : 'Saving Campaign...'}
                    </span>
                  </>
                ) : (
                  <span>
                    {scheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
                  </span>
                )}
              </Button>
            </div>

            {/* Right Panel - Phone Preview */}
            <div className="bg-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex justify-center">
                <div className="relative w-[280px] h-[500px] bg-black rounded-[28px] p-[8px] shadow-xl">
                  <div className="bg-white h-full w-full rounded-[20px] overflow-hidden flex flex-col">
                    <div className="p-2 text-center text-xs bg-gray-100 flex justify-between items-center">
                      <span>9:41</span>
                      <div className="flex items-center space-x-1">
                        <div className="h-1 w-1 rounded-full bg-black"></div>
                        <div className="h-1 w-1 rounded-full bg-black"></div>
                        <div className="h-1 w-1 rounded-full bg-black"></div>
                      </div>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto">
                      <div className="text-xs text-gray-500 text-center mb-2">
                        +1773-389-7839
                      </div>
                      {message || attachedImage ? (
                        <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[85%] text-sm leading-relaxed space-y-2">
                          {attachedImage && (
                            <div className="rounded overflow-hidden">
                              <img 
                                src={attachedImage.url} 
                                alt="Attached"
                                className="w-full h-auto max-h-32 object-cover"
                              />
                            </div>
                          )}
                          {message && <div>{message}</div>}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
                          Message preview will appear here
                        </div>
                      )}
                      {(message || attachedImage) && (
                        <div className="text-xs text-gray-400 text-center mt-2">
                          STOP to end
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
    </TooltipProvider>
  );
};

export default CreateCampaignPage;
