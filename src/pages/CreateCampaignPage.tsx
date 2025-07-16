
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Clock, Users, Send, AlertCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const { profileData, loading: profileLoading } = useProfile();
  
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [segments, setSegments] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<'immediate' | 'later'>('immediate');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loadingSegments, setLoadingSegments] = useState(true);

  // Check if user has configured a textable number
  const hasTextableNumber = profileData?.textableNumber && profileData.textableNumber.trim() !== '';

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoadingSegments(true);
      const { data, error } = await supabase
        .from('contacts_segments')
        .select('segment_name')
        .order('segment_name');

      if (error) {
        console.error('Error fetching segments:', error);
        toast({
          title: "Error",
          description: "Failed to load segments",
          variant: "destructive",
        });
        return;
      }

      const segmentNames = data?.map(segment => segment.segment_name) || [];
      setSegments(segmentNames);
    } catch (error) {
      console.error('Error in fetchSegments:', error);
      toast({
        title: "Error",
        description: "Failed to load segments",
        variant: "destructive",
      });
    } finally {
      setLoadingSegments(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !message || !selectedSegment) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!hasTextableNumber) {
      toast({
        title: "No Textable Number Configured",
        description: "Please configure a textable number in Settings before creating campaigns",
        variant: "destructive",
      });
      return;
    }

    if (scheduleType === 'later' && (!scheduleDate || !scheduleTime)) {
      toast({
        title: "Missing Schedule Information",
        description: "Please select both date and time for scheduled campaigns",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      let scheduleDateTime = null;
      if (scheduleType === 'later' && scheduleDate && scheduleTime) {
        const [hours, minutes] = scheduleTime.split(':');
        const scheduledDate = new Date(scheduleDate);
        scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduleDateTime = scheduledDate.toISOString();
      }

      // Create campaign in database
      const { data: campaign, error: campaignError } = await supabase
        .from('telnyx_campaigns')
        .insert([
          {
            campaign_name: campaignName,
            message: message,
            recipients: [],
            schedule_type: scheduleType,
            schedule_time: scheduleDateTime,
            status: 'pending',
            media_url: mediaUrl || null,
            segment_name: selectedSegment,
          }
        ])
        .select()
        .single();

      if (campaignError) {
        console.error('Error creating campaign:', campaignError);
        toast({
          title: "Error",
          description: "Failed to create campaign",
          variant: "destructive",
        });
        return;
      }

      console.log('Campaign created:', campaign);

      // Send to bulk SMS function with the user's textable number
      const { data: smsResult, error: smsError } = await supabase.functions.invoke('send-bulk-sms-via-telnyx', {
        body: {
          segment_name: selectedSegment,
          text: message,
          from: profileData.textableNumber, // Use user's configured textable number
          media_urls: mediaUrl ? [mediaUrl] : undefined,
          campaign_id: campaign.id,
          send_at: scheduleDateTime,
        },
      });

      if (smsError) {
        console.error('Error sending bulk SMS:', smsError);
        toast({
          title: "Error",
          description: "Failed to start SMS campaign",
          variant: "destructive",
        });
        return;
      }

      console.log('Bulk SMS result:', smsResult);

      toast({
        title: "Campaign Created Successfully",
        description: scheduleType === 'later' 
          ? `Campaign scheduled for ${format(new Date(scheduleDateTime!), 'PPP p')}`
          : "Campaign is being sent now",
      });

      // Navigate to campaigns page
      navigate('/campaigns');

    } catch (error) {
      console.error('Error in handleCreateCampaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create SMS Campaign</h1>
        <p className="text-gray-600">Create and schedule SMS campaigns for your contact segments</p>
      </div>

      {!hasTextableNumber && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You need to configure a textable number before creating campaigns.{' '}
            <Button
              variant="link"
              className="h-auto p-0 text-orange-600 underline"
              onClick={() => navigate('/settings/numbers')}
            >
              Go to Textable Numbers settings
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Campaign Details
            </CardTitle>
            <CardDescription>
              Configure your SMS campaign settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input
                id="campaign-name"
                placeholder="e.g., Summer Sale Announcement"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment">Target Segment *</Label>
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingSegments ? "Loading segments..." : "Select a segment"} />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment} value={segment}>
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Type your SMS message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              <div className="text-sm text-gray-500">
                {message.length}/160 characters
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media-url">Media URL (Optional)</Label>
              <Input
                id="media-url"
                placeholder="https://example.com/image.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Send */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule & Send
            </CardTitle>
            <CardDescription>
              Choose when to send your campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Delivery Time</Label>
              <RadioGroup
                value={scheduleType}
                onValueChange={(value: 'immediate' | 'later') => setScheduleType(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate">Send immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="later" id="later" />
                  <Label htmlFor="later">Schedule for later</Label>
                </div>
              </RadioGroup>
            </div>

            {scheduleType === 'later' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Date</Label>
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
                        {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Select Time</Label>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">From Number:</span>
                <span className="font-medium">
                  {hasTextableNumber ? profileData.textableNumber : 'Not configured'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Target Segment:</span>
                <span className="font-medium">{selectedSegment || 'None selected'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Schedule:</span>
                <Badge variant={scheduleType === 'immediate' ? 'default' : 'secondary'}>
                  {scheduleType === 'immediate' ? 'Immediate' : 'Scheduled'}
                </Badge>
              </div>
            </div>

            <Button 
              onClick={handleCreateCampaign}
              disabled={isCreating || !hasTextableNumber}
              className="w-full"
              size="lg"
            >
              {isCreating ? 'Creating Campaign...' : 
               scheduleType === 'immediate' ? 'Send Campaign Now' : 'Schedule Campaign'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
