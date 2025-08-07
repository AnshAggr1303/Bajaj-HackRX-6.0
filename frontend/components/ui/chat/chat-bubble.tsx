"use client"

import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { UserRound } from 'lucide-react'
import { Button, type ButtonProps } from "../button"
import MessageLoading from "../message-loading"

// ChatBubble
const chatBubbleVariant = cva(
  "flex gap-2 items-end relative group",
  {
    variants: {
      variant: {
        received: "self-start w-full",
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
        "relative group mb-4",
        className
      )}
      ref={ref}
      {...props}
    >
      {/* Add avatar for sent messages */}
      <ChatBubbleAvatar variant={variant} />
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && typeof child.type !== "string"
          ? React.cloneElement(child, {
              variant,
              layout,
            } as React.ComponentProps<typeof child.type>)
          : child
      )}
    </div>
  )
)
ChatBubble.displayName = "ChatBubble"

// ChatBubbleMessage
const chatBubbleMessageVariants = cva("", {
  variants: {
    variant: {
      received: "text-slate-900 bg-[#fafafa] rounded-2xl rounded-tl-md py-3 px-4",
      sent: "py-3 px-4 bg-slate-700 text-white rounded-2xl rounded-tr-md",
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
        "break-words max-w-[80%] whitespace-pre-wrap inline-block",
        className
      )}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
          <span className="text-sm text-slate-600">Assistant is analyzing your request...</span>
        </div>
      ) : (
        children
      )}
    </div>
  )
)
ChatBubbleMessage.displayName = "ChatBubbleMessage"

// ChatBubbleAvatar - Only for user messages
const ChatBubbleAvatar: React.FC<{ variant?: "sent" | "received" | null }> = ({ variant }) => {
  if (variant !== "sent") return null
  
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
      <UserRound size={24} strokeWidth={1.5} className="text-slate-700" fill="currentColor" />
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
  <div className={cn("text-xs mt-2 text-slate-500", className)} {...props}>
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
    className={cn("h-6 w-6 rounded-full p-1 hover:bg-slate-200 transition-colors", className)}
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
      "absolute top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity duration-200",
      variant === "sent"
        ? "-left-1 -translate-x-full flex-row-reverse"
        : "-right-1 translate-x-full",
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
