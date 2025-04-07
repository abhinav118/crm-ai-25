
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
}

export function ChatBubble({
  className,
  children,
  variant = "received",
  ...props
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-max max-w-[75%] gap-2 py-2",
        variant === "sent" ? "ml-auto flex-row-reverse" : "mr-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ChatBubbleAvatarProps extends React.ComponentProps<typeof Avatar> {}

export function ChatBubbleAvatar({
  className,
  ...props
}: ChatBubbleAvatarProps) {
  return <Avatar className={cn("h-8 w-8", className)} {...props} />;
}

interface ChatBubbleMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
  isLoading?: boolean;
}

export function ChatBubbleMessage({
  className,
  children,
  variant = "received",
  isLoading = false,
  ...props
}: ChatBubbleMessageProps) {
  return (
    <div
      className={cn(
        "min-h-10 rounded-xl px-4 py-2 text-sm",
        variant === "sent"
          ? "bg-primary text-primary-foreground"
          : "bg-muted",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.2s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0.4s]"></div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
