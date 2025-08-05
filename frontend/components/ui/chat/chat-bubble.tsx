"use client"

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { User, Bot } from "lucide-react" // ✅ FIXED: changed from UserRound to User
import { Button, type ButtonProps } from "../button"
import MessageLoading from "../message-loading"

// ChatBubble
const chatBubbleVariant = cva(
  "flex gap-3 items-start relative group w-full",
  {
    variants: {
      variant: {
        received: "self-start",
        sent: "self-end flex-row-reverse",
      },
      layout: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "received",
      layout: "default",
    },
  }
)

interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariant> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, layout, children, ...props }, ref) => (
    <div
      className={cn(
        chatBubbleVariant({ variant, layout }),
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Avatar */}
      <ChatBubbleAvatar variant={variant} />
      
      <div className="flex flex-col gap-1 max-w-[80%]">
        {React.Children.map(children, (child) =>
          React.isValidElement(child) && typeof child.type !== "string"
            ? React.cloneElement(child, {
                variant,
                layout,
              } as React.ComponentProps<typeof child.type>)
            : child
        )}
      </div>
    </div>
  )
)
ChatBubble.displayName = "ChatBubble"

// ChatBubbleMessage
const chatBubbleMessageVariants = cva("break-words whitespace-pre-wrap", {
  variants: {
    variant: {
      received: "bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm",
      sent: "bg-[#007AFF] text-white rounded-2xl rounded-tr-md px-4 py-3",
    },
    layout: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "received",
    layout: "default",
  },
})

interface ChatBubbleMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean
}

const ChatBubbleMessage = React.forwardRef<
  HTMLDivElement,
  ChatBubbleMessageProps
>(
  (
    { className, variant, layout, isLoading = false, children, ...props },
    ref
  ) => (
    <div
      className={cn(
        chatBubbleMessageVariants({ variant, layout }),
        className
      )}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2 py-2">
          <MessageLoading />
          <span className="text-sm text-gray-500">Analyzing your query...</span>
        </div>
      ) : (
        children
      )}
    </div>
  )
)
ChatBubbleMessage.displayName = "ChatBubbleMessage"

// ChatBubbleAvatar
const ChatBubbleAvatar: React.FC<{ variant?: "sent" | "received" | null }> = ({ variant }) => {
  if (variant === "sent") {
    return (
      <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center flex-shrink-0 mt-1">
        <User size={18} className="text-white" fill="currentColor" /> {/* ✅ FIXED ICON */}
      </div>
    )
  }
  
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
      <Bot size={18} className="text-white" />
    </div>
  )
}

// ChatBubbleTimestamp
interface ChatBubbleTimestampProps
  extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string
}

const ChatBubbleTimestamp: React.FC<ChatBubbleTimestampProps> = ({
  timestamp,
  className,
  ...props
}) => (
  <div 
    className={cn("text-xs text-gray-500 mt-1", className)} 
    {...props}
  >
    {timestamp}
  </div>
)

// ChatBubbleAction
type ChatBubbleActionProps = ButtonProps & {
  icon: React.ReactNode
}

const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({
  icon,
  onClick,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}) => (
  <Button
    variant={variant}
    size={size}
    className={cn("h-6 w-6", className)}
    onClick={onClick}
    {...props}
  >
    {icon}
  </Button>
)

interface ChatBubbleActionWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received"
  className?: string
}

const ChatBubbleActionWrapper = React.forwardRef<
  HTMLDivElement,
  ChatBubbleActionWrapperProps
>(({ variant, className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1",
      variant === "sent" ? "justify-end" : "justify-start",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
ChatBubbleActionWrapper.displayName = "ChatBubbleActionWrapper"

export {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  ChatBubbleMessage,
  chatBubbleMessageVariants,
  ChatBubbleTimestamp,
  chatBubbleVariant,
}
