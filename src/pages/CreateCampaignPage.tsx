
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Send, Clock, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// Personalization helper functions
function personalizeMessage(template: string, contact: any) {
  return template
    .replace(/{{first_name}}/gi, contact?.first_name || 'there')
    .replace(/{{last_name}}/gi, contact?.last_name || '')
    .replace(/{{company}}/gi, contact?.company || '');
}

function cleanUnfilledTokens(text: string) {
  return text
    .replace(/{{first_name}}/gi, '')
    .replace(/{{last_name}}/gi, '')
    .replace(/{{company}}/gi, '')
    .replace(/\s{2,}/g, ' ') // clean double spaces
    .trim();
}

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch segments
  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts_segments')
        .select('segment_name, contacts_membership')
        .order('segment_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Get a sample contact from selected segment for preview
  const selectedSegmentData = segments.find(seg => seg.segment_name === selectedSegment);
  const sampleContact = selectedSegmentData?.contacts_membership?.[0];

  // Prefill form if coming from another page with state
  useEffect(() => {
    if (location.state) {
      const {
        prefilledMessage,
        campaignName: prefillCampaignName,
        mediaUrl: prefillMediaUrl,
      } = location.state;
      
      if (prefilledMessage) setMessage(prefilledMessage);
      if (prefillCampaignName) setCampaignName(prefillCampaignName);
      if (prefillMediaUrl) setMediaUrl(prefillMediaUrl);
    }
  }, [location.state]);

  const handleMediaUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dxle1lgys/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        setMediaUrl(data.secure_url);
        toast({ title: 'Media uploaded successfully' });
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({ title: 'Error uploading media', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !message || !selectedSegment) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create campaign record
      const campaignData = {
        campaign_name: campaignName,
        message: message,
        segment_name: selectedSegment,
        schedule_type: scheduleType,
        schedule_time: scheduleType === 'later' && scheduleDate && scheduleTime 
          ? new Date(`${format(scheduleDate, 'yyyy-MM-dd')}T${scheduleTime}`).toISOString()
          : null,
        media_url: mediaUrl || null,
        recipients: [],
        status: 'pending'
      };

      const { data: campaign, error: campaignError } = await supabase
        .from('telnyx_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Send bulk SMS
      const { error: smsError } = await supabase.functions.invoke('send-bulk-sms-via-telnyx', {
        body: {
          segment_name: selectedSegment,
          text: message,
          media_urls: mediaUrl ? [mediaUrl] : undefined,
          campaign_id: campaign.id,
          send_at: campaignData.schedule_time
        }
      });

      if (smsError) throw smsError;

      toast({ 
        title: scheduleType === 'now' ? 'Campaign sent successfully!' : 'Campaign scheduled successfully!',
        description: `Your ${scheduleType === 'now' ? 'messages are being sent' : 'campaign has been scheduled'}.`
      });

      navigate('/campaigns');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({ 
        title: 'Error creating campaign', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate preview content with personalization
  const previewContent = sampleContact
    ? personalizeMessage(message, sampleContact)
    : cleanUnfilledTokens(message);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create SMS Campaign</h1>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name *</Label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="segment">Select Segment *</Label>
                  <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((segment) => (
                        <SelectItem key={segment.segment_name} value={segment.segment_name}>
                          {segment.segment_name} ({segment.contacts_membership?.length || 0} contacts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message. Use {{first_name}}, {{last_name}}, or {{company}} for personalization."
                    rows={4}
                    required
                  />
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Available personalization tokens:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li><code>{{first_name}}</code> - Contact's first name (defaults to "there")</li>
                      <li><code>{{last_name}}</code> - Contact's last name</li>
                      <li><code>{{company}}</code> - Contact's company</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <Label htmlFor="media">Media (Optional)</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMediaFile(file);
                          handleMediaUpload(file);
                        }
                      }}
                      className="hidden"
                      id="media-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('media-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Media
                    </Button>
                  </div>
                  {mediaUrl && (
                    <div className="mt-2">
                      <img src={mediaUrl} alt="Uploaded media" className="max-w-full h-32 object-cover rounded" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Send Option</Label>
                  <Select value={scheduleType} onValueChange={setScheduleType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send Now</SelectItem>
                      <SelectItem value="later">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduleType === 'later' && (
                  <>
                    <div>
                      <Label>Schedule Date</Label>
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
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduleDate}
                            onSelect={setScheduleDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="scheduleTime">Schedule Time</Label>
                      <Input
                        id="scheduleTime"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                "Processing..."
              ) : (
                <>
                  {scheduleType === 'now' ? <Send className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                  {scheduleType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="bg-white rounded-lg shadow-sm border max-w-sm mx-auto">
                    <div className="bg-blue-500 text-white p-3 rounded-t-lg">
                      <h3 className="font-semibold">SMS Preview</h3>
                    </div>
                    <div className="p-4">
                      {mediaUrl && (
                        <div className="mb-3">
                          <img src={mediaUrl} alt="MMS content" className="w-full rounded" />
                        </div>
                      )}
                      <p className="text-gray-800 text-sm leading-relaxed">
                        {previewContent || "Enter your message to see preview..."}
                      </p>
                      {sampleContact && (
                        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                          Preview using: {sampleContact.name || `${sampleContact.first_name} ${sampleContact.last_name}`.trim()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedSegment && (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Recipients:</span>
                      <span className="font-semibold">
                        {selectedSegmentData?.contacts_membership?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Segment:</span>
                      <span className="font-semibold">{selectedSegment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Schedule:</span>
                      <span className="font-semibold">
                        {scheduleType === 'now' ? 'Send Now' : 
                         scheduleDate && scheduleTime ? 
                         `${format(scheduleDate, 'MMM d, yyyy')} at ${scheduleTime}` : 
                         'Not set'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
