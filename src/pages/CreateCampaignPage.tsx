import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarIcon, Upload, X, ArrowLeft } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Helper function to validate URL format
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Get edit campaign ID from URL params
  const editCampaignId = searchParams.get('editCampaignId');
  
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [date, setDate] = React.useState<Date>();

  // Fetch campaign data for editing
  const { data: campaignToEdit } = useQuery({
    queryKey: ['campaign', editCampaignId],
    queryFn: async () => {
      if (!editCampaignId) return null;
      
      const { data, error } = await supabase
        .from('telnyx_campaigns')
        .select('*')
        .eq('id', editCampaignId)
        .single();

      if (error) {
        console.error('Error fetching campaign:', error);
        toast({
          title: "Error",
          description: "Failed to load campaign data",
          variant: "destructive",
        });
        return null;
      }

      return data;
    },
    enabled: !!editCampaignId
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (campaignToEdit) {
      setCampaignName(campaignToEdit.campaign_name || '');
      setMessage(campaignToEdit.message || '');
      setRecipients(campaignToEdit.recipients || []);
      setScheduleType(campaignToEdit.schedule_type || 'now');
      
      if (campaignToEdit.schedule_time) {
        setScheduleDate(new Date(campaignToEdit.schedule_time));
        setScheduleTime(format(new Date(campaignToEdit.schedule_time), 'HH:mm'));
      }
      
      if (campaignToEdit.media_url) {
        setMediaUrl(campaignToEdit.media_url);
        setPreviewImage(campaignToEdit.media_url);
      }
    }
  }, [campaignToEdit]);

  useEffect(() => {
    const scheduleFor = searchParams.get('scheduleFor');
    if (scheduleFor) {
      setScheduleType('later');
      setScheduleDate(new Date(scheduleFor));
    }
  }, [searchParams]);

  const handleAddRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (recipientToRemove: string) => {
    setRecipients(recipients.filter(recipient => recipient !== recipientToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsImageUploading(true);
    try {
      const fileName = `campaign-images/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('campaign-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const publicUrl = `https://nzsflibcvrisxjlzuxjn.supabase.co/storage/v1/object/public/${data.path}`;
      setMediaUrl(publicUrl);
      setPreviewImage(publicUrl);
    } catch (error) {
      console.error('Unexpected error uploading image:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during image upload.",
        variant: "destructive",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setMediaUrl('');
    setPreviewImage('');
  };

  const validateCampaign = () => {
    if (!campaignName) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!message) {
      toast({
        title: "Error",
        description: "Message body is required",
        variant: "destructive",
      });
      return false;
    }

    if (recipients.length === 0) {
      toast({
        title: "Error",
        description: "At least one recipient is required",
        variant: "destructive",
      });
      return false;
    }

    if (mediaUrl && !isValidUrl(mediaUrl)) {
      toast({
        title: "Error",
        description: "Invalid media URL format",
        variant: "destructive",
      });
      return false;
    }

    if (scheduleType === 'later') {
      if (!scheduleDate) {
        toast({
          title: "Error",
          description: "Schedule date is required",
          variant: "destructive",
        });
        return false;
      }

      if (!scheduleTime) {
        toast({
          title: "Error",
          description: "Schedule time is required",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSaveCampaign = async () => {
    if (!validateCampaign()) {
      return;
    }

    try {
      setIsLoading(true);

      const campaignData = {
        campaign_name: campaignName,
        message,
        recipients,
        schedule_type: scheduleType,
        schedule_time: scheduleType === 'later' && scheduleDate && scheduleTime 
          ? new Date(`${format(scheduleDate, 'yyyy-MM-dd')}T${scheduleTime}:00.000Z`).toISOString()
          : null,
        repeat_frequency: repeatFrequency || null,
        repeat_days: selectedDays.length > 0 ? selectedDays : null,
        status: scheduleType === 'later' ? 'scheduled' : 'sent',
        media_url: mediaUrl || null
      };

      console.log('Saving campaign:', campaignData);

      if (editCampaignId) {
        // Update existing campaign
        const { error } = await supabase
          .from('telnyx_campaigns')
          .update(campaignData)
          .eq('id', editCampaignId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Campaign updated successfully",
        });
      } else {
        // Create new campaign
        const { data: savedCampaign, error: saveError } = await supabase
          .from('telnyx_campaigns')
          .insert([campaignData])
          .select()
          .single();

        if (saveError) throw saveError;

        // Send the campaign via the edge function
        const telnyxPayload = {
          to: recipients,
          message,
          media_url: mediaUrl,
          schedule_type: scheduleType,
          schedule_time: campaignData.schedule_time
        };

        const { data, error } = await supabase.functions.invoke('send-via-telnyx', {
          body: telnyxPayload
        });

        if (error) throw error;

        console.log('Campaign response:', data);

        if (data.success) {
          toast({
            title: "Success",
            description: scheduleType === 'later' 
              ? `Campaign scheduled successfully for ${data.scheduled_count} recipient(s)`
              : `Campaign sent successfully to ${data.sent_count} recipient(s)`,
          });
        } else {
          throw new Error(data.message || 'Failed to process campaign');
        }
      }

      // Navigate back to campaigns page
      navigate('/campaigns');

    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {editCampaignId ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
        </div>

        {/* Campaign Form */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Campaign Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="Enter campaign name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            {/* Message Body */}
            <div className="grid gap-2">
              <Label htmlFor="message">Message Body</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Recipients */}
            <div className="grid gap-2">
              <Label>Recipients</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Add recipient email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                />
                <Button type="button" size="sm" onClick={handleAddRecipient}>
                  Add
                </Button>
              </div>
              <ul className="list-none p-0">
                {recipients.map(recipient => (
                  <li key={recipient} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                    {recipient}
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveRecipient(recipient)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Media Upload */}
            <div className="grid gap-2">
              <Label>Media (Optional)</Label>
              {previewImage ? (
                <div className="relative">
                  <img src={previewImage} alt="Media Preview" className="rounded-md max-h-48 w-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 text-gray-900 shadow-sm"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    type="file"
                    id="media"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                  <Label htmlFor="media" className="cursor-pointer rounded-md border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-100">
                    {isImageUploading ? 'Uploading...' : <div className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Media</div>}
                  </Label>
                  {mediaUrl && <p className="text-xs text-gray-500">Uploaded: {mediaUrl}</p>}
                </>
              )}
            </div>

            {/* Schedule Type */}
            <div className="grid gap-2">
              <Label>Schedule</Label>
              <Tabs defaultValue="now" onValueChange={setScheduleType}>
                <TabsList>
                  <TabsTrigger value="now">Send Now</TabsTrigger>
                  <TabsTrigger value="later">Schedule for Later</TabsTrigger>
                </TabsList>
                <TabsContent value="now">
                  <p className="text-sm text-gray-500">Your message will be sent immediately.</p>
                </TabsContent>
                <TabsContent value="later">
                  <div className="grid gap-4">
                    {/* Date Picker */}
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={{
                              before: new Date(),
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Picker */}
                    <div className="grid gap-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        type="time"
                        id="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Save Button */}
            <Button onClick={handleSaveCampaign} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Campaign'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
