
import React, { useState, FormEvent } from "react";
import { Bot, Paperclip, Mic, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";

type Message = {
  id: number;
  content: string;
  sender: "user" | "ai";
};

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! How can I help you with Lumen CRM today?",
      sender: "ai",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      content: input,
      sender: "user" as const,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        content: getAIResponse(input),
        sender: "ai" as const,
      };
      
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes("hello") || input.includes("hi")) {
      return "Hello! How can I assist you with Lumen CRM today?";
    } else if (input.includes("contact") || input.includes("contacts")) {
      return "You can manage your contacts in the Contacts section of the CRM. Would you like to learn how to add, edit, or filter contacts?";
    } else if (input.includes("analytics")) {
      return "The Analytics section provides insights into your data. You can view different metrics by navigating to the Analytics page from the sidebar.";
    } else if (input.includes("help")) {
      return "I'm here to help! You can ask me about CRM features, how to manage contacts, view analytics, or any other feature you'd like to learn about.";
    } else if (input.includes("feature") || input.includes("capabilities")) {
      return "Lumen CRM offers contact management, analytics, messaging, calendar integration, and more. Which feature would you like to learn about?";
    } else {
      return "I'm here to assist with any questions about Lumen CRM. Feel free to ask about specific features or how to accomplish tasks within the system!";
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
    >
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <h1 className="text-xl font-semibold">Lumen CRM Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Ask me anything about the CRM
        </p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
              >
                {message.sender === "user" ? "U" : "AI"}
              </ChatBubbleAvatar>
              <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
              >
                {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
              >
                AI
              </ChatBubbleAvatar>
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <PromptSuggestion onClick={() => handlePromptClick("How do I add contacts?")}>
            How do I add contacts?
          </PromptSuggestion>
          <PromptSuggestion onClick={() => handlePromptClick("Show me analytics features")}>
            Show me analytics features
          </PromptSuggestion>
          <PromptSuggestion onClick={() => handlePromptClick("What can this CRM do?")}>
            What can this CRM do?
          </PromptSuggestion>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                type="button"
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                type="button"
              >
                <Mic className="size-4" />
              </Button>
            </div>
            <Button type="submit" size="sm" className="ml-auto gap-1.5" disabled={!input.trim() || isLoading}>
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
};

export default AIChat;
