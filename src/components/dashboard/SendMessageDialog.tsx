import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Send, MessageSquare, Upload, Smile } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Avatar from '@/components/dashboard/Avatar';
import { Contact } from './ContactsTable';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getFullName } from '@/utils/contactHelpers';

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
  const [activeTab, setActiveTab] = useState('sms');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [scheduleType, setScheduleType] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);

  useEffect(() => {
    // Count recipients based on the selected tab
    if (activeTab === 'sms') {
      const smsRecipients = selectedContacts.filter(contact => contact.phone);
      setRecipientCount(smsRecipients.length);
    } else {
      const emailRecipients = selectedContacts.filter(contact => contact.email);
      setRecipientCount(emailRecipients.length);
    }
  }, [selectedContacts, activeTab]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      });
      return;
    }

    if (recipientCount === 0) {
      toast({
        title: 'Error',
        description: `No ${activeTab === 'sms' ? 'phone numbers' : 'email addresses'} found for selected contacts`,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Here you would implement the actual sending logic
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log the message for each contact
      for (const contact of selectedContacts) {
        if (activeTab === 'sms' && contact.phone) {
          // Insert into messages table
          await supabase.from('messages').insert({
            contact_id: contact.id,
            content: message,
            sender: 'user',
            channel: 'sms'
          });
        } else if (activeTab === 'email' && contact.email) {
          // Insert into messages table
          await supabase.from('messages').insert({
            contact_id: contact.id,
            content: `${subject}\n\n${message}`,
            sender: 'user',
            channel: 'email'
          });
        }
      }

      toast({
        title: 'Success',
        description: `${activeTab.toUpperCase()} sent to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}`,
      });

      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to your storage service
      // For now, we'll just set a placeholder URL
      setMediaUrl(URL.createObjectURL(file));
      toast({
        title: 'File uploaded',
        description: `${file.name} has been uploaded`,
      });
    }
  };

  const getValidContacts = () => {
    if (activeTab === 'sms') {
      return selectedContacts.filter(contact => contact.phone);
    } else {
      return selectedContacts.filter(contact => contact.email);
    }
  };

  const getInvalidContacts = () => {
    if (activeTab === 'sms') {
      return selectedContacts.filter(contact => !contact.phone);
    } else {
      return selectedContacts.filter(contact => !contact.email);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Message
          </DialogTitle>
          <DialogDescription>
            Send SMS or Email to selected contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipients */}
          <div>
            <h3 className="text-lg font-medium mb-3">Recipients ({selectedContacts.length})</h3>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedContacts.map(contact => (
                <Avatar 
                  key={contact.id} 
                  name={getFullName(contact)} 
                  status={contact.status}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {/* Channel Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="sms" className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} with phone numbers
                </span>
                {getInvalidContacts().length > 0 && (
                  <span className="text-sm text-orange-600">
                    {getInvalidContacts().length} contact{getInvalidContacts().length !== 1 ? 's' : ''} without phone numbers will be skipped
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="sms-message">Message</Label>
                  <div className="relative">
                    <Textarea
                      id="sms-message"
                      placeholder="Type your SMS message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={160}
                      className="pr-16"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {message.length}/160
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddEmoji('😊')}
                    type="button"
                  >
                    <Smile className="h-4 w-4 mr-1" />
                    😊
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddEmoji('👍')}
                    type="button"
                  >
                    👍
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddEmoji('🎉')}
                    type="button"
                  >
                    🎉
                  </Button>
                </div>

                <div>
                  <Label htmlFor="media-upload">Media (Optional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="media-upload"
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('media-upload')?.click()}
                      type="button"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Media
                    </Button>
                    {mediaUrl && (
                      <Badge variant="secondary">Media attached</Badge>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} with email addresses
                </span>
                {getInvalidContacts().length > 0 && (
                  <span className="text-sm text-orange-600">
                    {getInvalidContacts().length} contact{getInvalidContacts().length !== 1 ? 's' : ''} without email addresses will be skipped
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    placeholder="Enter email subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email-message">Message</Label>
                  <Textarea
                    id="email-message"
                    placeholder="Type your email message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Scheduling */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Scheduling</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="schedule-type">Send</Label>
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
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || recipientCount === 0}
              className="gap-2"
            >
              {isLoading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send {activeTab.toUpperCase()} ({recipientCount})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageDialog;
