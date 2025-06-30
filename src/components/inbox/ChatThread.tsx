
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { getFullName } from '@/utils/contactHelpers';
import { formatDistanceToNow } from 'date-fns';
import { 
  Smile, 
  Paperclip, 
  Image, 
  Link, 
  FileText, 
  Send,
  StickyNote,
  X
} from 'lucide-react';

interface ChatThreadProps {
  conversation: Conversation;
  onClose: () => void;
}

const ChatThread: React.FC<ChatThreadProps> = ({ conversation, onClose }) => {
  const [messageText, setMessageText] = useState('');
  const [noteText, setNoteText] = useState(conversation.notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useMessages(conversation.contact_id);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  const formatPhone = (phone?: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    try {
      await sendMessage({
        contactId: conversation.contact_id,
        content: messageText,
        channel: smsEnabled ? 'sms' : 'email'
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {getFullName(conversation.contact)}
            </h3>
            <p className="text-sm text-gray-600">
              {formatPhone(conversation.contact.phone)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select defaultValue="you">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="you">You</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">No messages yet</div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Notes Section */}
      {showNotes && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Notes</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            placeholder="Add notes about this conversation..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="resize-none"
            rows={3}
          />
          <Button size="sm" className="mt-2">
            Save Note
          </Button>
        </div>
      )}

      {/* Message Composer */}
      <div className="p-4 border-t border-gray-200">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Smile className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Image className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Link className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <FileText className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant={showNotes ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
            >
              <StickyNote className="w-4 h-4 mr-1" />
              Add Note
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">SMS</span>
              <Switch
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
              />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 resize-none"
            rows={3}
          />
          <div className="flex flex-col space-y-2">
            <div className="text-xs text-gray-500 text-right">
              {messageText.length}/160
            </div>
            <Button
              onClick={handleSend}
              disabled={!messageText.trim() || isSending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
