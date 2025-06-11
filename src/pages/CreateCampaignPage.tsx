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
  Info
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

const CreateCampaignPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toQuery, setToQuery] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleOption, setScheduleOption] = useState('send_now');
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPersonalizationTags, setShowPersonalizationTags] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{name: string, url: string}>>([]);
  const [calendarInfo, setCalendarInfo] = useState<string | null>(null);
  
  // Schedule Later fields
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('09:00');
  
  // Schedule Recurring fields
  const [repeatType, setRepeatType] = useState('daily');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [recurringStartDate, setRecurringStartDate] = useState<Date>(new Date());
  const [recurringTime, setRecurringTime] = useState('09:00');
  const [endType, setEndType] = useState('never');
  const [endAfterOccurrences, setEndAfterOccurrences] = useState(10);
  const [endDate, setEndDate] = useState<Date>();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
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
    segment.toLowerCase().includes(toQuery.toLowerCase())
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
      
      setScheduleOption('schedule_later');
      setScheduleDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
      setScheduleTime(targetDate.toTimeString().slice(0, 5));
      
      setCalendarInfo(`Scheduled from calendar for ${format(targetDate, 'MMMM d, yyyy')}`);
    }

    // Handle campaign ID parameter (from "View Campaign" button)
    if (fromCampaignId && sampleCampaignData[fromCampaignId as keyof typeof sampleCampaignData]) {
      const campaign = sampleCampaignData[fromCampaignId as keyof typeof sampleCampaignData];
      
      setCampaignName(campaign.name);
      setMessage(campaign.message);
      setToQuery(campaign.to);
      
      if (campaign.scheduleType === 'schedule_later') {
        const campaignDate = new Date(campaign.scheduledFor);
        setScheduleOption('schedule_later');
        setScheduleDate(new Date(campaignDate.getFullYear(), campaignDate.getMonth(), campaignDate.getDate()));
        setScheduleTime(campaignDate.toTimeString().slice(0, 5));
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

  const handleToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToQuery(value);
    setShowSegmentDropdown(value.length > 0);
  };

  const handleSegmentSelect = (segment: string) => {
    setToQuery(segment);
    setShowSegmentDropdown(false);
    toInputRef.current?.blur();
  };

  const handleEmojiSelect = (emoji: any) => {
    const newMessage = insertAtCursor(message, emoji.native);
    setMessage(newMessage);
    setShowEmojiPicker(false);
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a preview URL for the file
    const fileUrl = URL.createObjectURL(file);
    const fileInfo = { name: file.name, url: fileUrl };
    
    setAttachedFiles(prev => [...prev, fileInfo]);
    
    // Insert file reference in message
    const fileRef = `📎 ${file.name}`;
    const newMessage = insertAtCursor(message, fileRef);
    setMessage(newMessage);
    
    toast({
      title: "File attached",
      description: `${file.name} has been attached to your message`,
    });
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

  const handleSaveCampaign = async () => {
    if (!toQuery.trim()) {
      toast({
        title: "Recipient is required",
        description: "Please select a recipient or audience segment",
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

    setIsLoading(true);

    try {
      console.log('Saving campaign:', { 
        to: toQuery, 
        campaignName, 
        message, 
        scheduleOption 
      });
      
      toast({
        title: "Campaign saved",
        description: "Your campaign has been saved successfully",
      });

      navigate('/campaigns');
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast({
        title: "Error",
        description: "An error occurred while saving the campaign",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSmsSegments = () => Math.ceil(charCount / 160);

  const getRecurringSummary = () => {
    if (scheduleOption !== 'schedule_recurring' || !recurringStartDate) return null;
    
    const intervalText = repeatInterval === 1 ? 
      repeatType.slice(0, -2) : // Remove 'ly' ending
      `${repeatInterval} ${repeatType === 'daily' ? 'days' : repeatType === 'weekly' ? 'weeks' : 'months'}`;
    
    const startText = format(recurringStartDate, 'MMMM d, yyyy');
    const timeText = recurringTime;
    
    let endText = '';
    if (endType === 'after') {
      endText = ` for ${endAfterOccurrences} occurrences`;
    } else if (endType === 'on' && endDate) {
      endText = ` until ${format(endDate, 'MMMM d, yyyy')}`;
    }
    
    return `Your message will be sent every ${intervalText} at ${timeText} starting ${startText}${endText}.`;
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
              
              {/* TO Field with Segment Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="to" className="text-sm font-medium">
                  To <span className="text-red-500">*</span>
                </Label>
                <div className="relative" ref={dropdownRef}>
                  <Input 
                    ref={toInputRef}
                    id="to"
                    placeholder="Enter numbers, contacts, or groups" 
                    value={toQuery}
                    onChange={handleToInputChange}
                    onFocus={() => setShowSegmentDropdown(toQuery.length > 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Message contacts and replies are only visible to you
                  </p>
                  
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
                  placeholder="e.g., Angel Flight Marketing Service" 
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
                          className="p-1 rounded hover:bg-gray-100"
                          onClick={handleFileAttach}
                          aria-label="Attach file"
                        >
                          <PaperclipIcon size={18} className="text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Attach file</TooltipContent>
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
                    accept="image/*,.pdf,.doc,.docx"
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
                  />
                  
                  {/* Attached Files Display */}
                  {attachedFiles.length > 0 && (
                    <div className="px-3 py-2 border-t bg-gray-50">
                      <p className="text-xs text-gray-600 mb-1">Attached files:</p>
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <PaperclipIcon size={12} className="text-gray-500" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 flex justify-between">
                    <span>{charCount} / 160 characters</span>
                    <span>{getSmsSegments()} SMS segment{getSmsSegments() !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Schedule Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Schedule</Label>
                <RadioGroup value={scheduleOption} onValueChange={setScheduleOption}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="send_now" id="send_now" />
                    <Label htmlFor="send_now" className="text-sm">Send Now</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="schedule_later" id="schedule_later" />
                    <Label htmlFor="schedule_later" className="text-sm">Schedule for Later</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="schedule_recurring" id="schedule_recurring" />
                    <Label htmlFor="schedule_recurring" className="text-sm">Schedule Recurring</Label>
                  </div>
                </RadioGroup>

                {/* Schedule for Later */}
                {scheduleOption === 'schedule_later' && (
                  <div className="mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !scheduleDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {scheduleDate ? format(scheduleDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={scheduleDate}
                              onSelect={setScheduleDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Time</Label>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-gray-500" />
                          <Input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Recurring */}
                {scheduleOption === 'schedule_recurring' && (
                  <div className="mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Repeats</Label>
                        <Select value={repeatType} onValueChange={setRepeatType}>
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
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Every</Label>
                        <Input
                          type="number"
                          min="1"
                          value={repeatInterval}
                          onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(recurringStartDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={recurringStartDate}
                              onSelect={(date) => setRecurringStartDate(date || new Date())}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Time</Label>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-gray-500" />
                          <Input
                            type="time"
                            value={recurringTime}
                            onChange={(e) => setRecurringTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Ends</Label>
                      <RadioGroup value={endType} onValueChange={setEndType}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="never" id="never" />
                          <Label htmlFor="never" className="text-sm">Never</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="after" id="after" />
                          <Label htmlFor="after" className="text-sm">After</Label>
                          {endType === 'after' && (
                            <Input
                              type="number"
                              min="1"
                              value={endAfterOccurrences}
                              onChange={(e) => setEndAfterOccurrences(parseInt(e.target.value) || 1)}
                              className="w-20 ml-2"
                            />
                          )}
                          {endType === 'after' && <span className="text-sm">occurrences</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="on" id="on_date" />
                          <Label htmlFor="on_date" className="text-sm">On</Label>
                          {endType === 'on' && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="ml-2 justify-start text-left font-normal"
                                  size="sm"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {endDate ? format(endDate, "PPP") : <span>Pick date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={endDate}
                                  onSelect={setEndDate}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Recurring Summary */}
                    {getRecurringSummary() && (
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">
                          <strong>Summary:</strong> {getRecurringSummary()}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Send Campaign Button */}
              <Button 
                onClick={handleSaveCampaign} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Sending Campaign...</span>
                  </>
                ) : (
                  <span>Send Campaign</span>
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
                        (952) 248-4727
                      </div>
                      {message ? (
                        <div className="bg-blue-500 text-white p-3 rounded-lg max-w-[85%] text-sm leading-relaxed">
                          {message}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-24 text-gray-400 text-xs">
                          Message preview will appear here
                        </div>
                      )}
                      {message && (
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

</edits_to_apply>
