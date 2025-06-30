
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Smile, Paperclip, Image, Link, FileText, Plus } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useContact } from '@/hooks/useContact';
import { getFullName } from '@/utils/contactHelpers';
import { format } from 'date-fns';

interface ChatThreadProps {
  contactId: string;
}

export const ChatThread: React.FC<ChatThreadProps> = ({ contactId }) => {
  const [message, setMessage] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: messagesLoading } = useMessages(contactId);
  const { data: contact } = useContact(contactId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !contact) return;

    sendMessage({
      contactId,
      content: message,
      channel: smsEnabled ? 'sms' : 'chat'
    }, {
      onSuccess: () => {
        setMessage('');
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCharacterCount = () => {
    const count = message.length;
    const segments = Math.ceil(count / 160);
    return { count, segments };
  };

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>Contact not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="font-semibold text-lg">{getFullName(contact)}</h2>
          <p className="text-sm text-gray-600">{contact.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="unassigned">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="you">You</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            SNOOZE
          </Button>
          <Button variant="outline" size="sm">
            CLOSE
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {format(new Date(msg.sent_at), 'h:mm a')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Notes Section */}
      {showNotes && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Textarea
            placeholder="Add notes about this conversation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
      )}

      {/* Message Composer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">SMS</span>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
            />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="resize-none min-h-[80px]"
              disabled={isSending}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="p-1">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
              {smsEnabled && (
                <div className="text-xs text-gray-500">
                  {getCharacterCount().count}/160 ({getCharacterCount().segments} segments)
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="px-6"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
