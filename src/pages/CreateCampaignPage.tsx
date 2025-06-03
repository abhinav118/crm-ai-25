
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  PaperclipIcon, 
  SmileIcon, 
  ZapIcon,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { PromptInput, PromptInputActions, PromptInputTextarea } from '@/components/ui/prompt-input';
import Sidebar from '@/components/dashboard/Sidebar';

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
  const [toQuery, setToQuery] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleOption, setScheduleOption] = useState('send_now');
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [showSegmentDropdown, setShowSegmentDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filter segments based on search query
  const filteredSegments = sampleSegments.filter(segment =>
    segment.toLowerCase().includes(toQuery.toLowerCase())
  );

  // Update character and word counts
  useEffect(() => {
    setCharCount(message.length);
    setWordCount(message.trim() ? message.trim().split(/\s+/).length : 0);
  }, [message]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSegmentDropdown(false);
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
      const { data, error } = await supabase.functions.invoke('generate-sms', {
        body: { prompt: aiPrompt }
      });
      
      if (error) throw error;
      
      if (data) {
        setMessage(data);
        setShowPromptInput(false);
        setAiPrompt('');
        
        toast({
          title: "Message generated",
          description: "AI-generated message has been created",
        });
      }
    } catch (error) {
      console.error("Error generating message:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate message",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number to send test",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to test",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Test sent",
      description: `Test message sent to ${testPhoneNumber}`,
    });
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

  return (
    <div className="flex w-full">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
        {/* Two-column layout: Form left, Preview right */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 max-w-6xl mx-auto px-4 py-6">
          
          {/* Left Panel - Form */}
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Create Campaign</h1>
            
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
                
                {/* Segment Dropdown */}
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

              {/* Message suggestions */}
              <div className="mb-3">
                <h4 className="text-sm text-muted-foreground mb-2">Quick templates:</h4>
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                    <PromptSuggestion 
                      key={index} 
                      size="sm"
                      variant="outline"
                      className="text-xs py-1"
                      onClick={() => setMessage(suggestion)}
                    >
                      {suggestion.length > 30 ? suggestion.substring(0, 30) + "..." : suggestion}
                    </PromptSuggestion>
                  ))}
                </div>
              </div>

              <div className="border rounded-md">
                <div className="flex items-center p-2 border-b bg-gray-50">
                  <button 
                    type="button"
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <SmileIcon size={18} className="text-gray-500" />
                  </button>
                  <button 
                    type="button"
                    className="p-1 rounded hover:bg-gray-100 mx-1"
                  >
                    <PaperclipIcon size={18} className="text-gray-500" />
                  </button>
                  <button 
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={() => setShowPromptInput(!showPromptInput)}
                  >
                    <ZapIcon size={18} className={showPromptInput ? "text-indigo-500" : "text-gray-500"} />
                  </button>
                </div>
                
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
                  id="message"
                  placeholder="Type your message here..." 
                  className="border-0 focus-visible:ring-0 resize-none min-h-[120px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 flex justify-between">
                  <span>{charCount} / 160 characters</span>
                  <span>{getSmsSegments()} SMS segment{getSmsSegments() !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Add Attachment */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <PaperclipIcon size={16} />
              <span>Add attachment</span>
            </div>

            {/* Test Campaign */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Test Campaign</Label>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Enter phone number" 
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                />
                <Button 
                  onClick={handleSendTest}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Send Test
                </Button>
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
  );
};

export default CreateCampaignPage;
