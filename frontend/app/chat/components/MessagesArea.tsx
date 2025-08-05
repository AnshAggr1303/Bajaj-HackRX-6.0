"use client"

import type React from "react"
import { MessageCircle, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Message } from "@/types/chat"
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"

interface MessagesAreaProps {
  messages: Message[]
  isLoading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
}

const MOTION_CONFIG = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    duration: 0.3,
    ease: "easeOut" as const,
  },
}

// Custom components for ReactMarkdown
const MarkdownComponents = {
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    
    if (!inline && language) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="rounded-lg my-4"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )
    }
    
    return (
      <code 
        className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" 
        {...props}
      >
        {children}
      </code>
    )
  },
  p: ({ children }: any) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{children}</h3>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-700 dark:text-gray-300">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a 
      href={href} 
      className="text-blue-600 dark:text-blue-400 hover:underline" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
  ),
}

interface CopyButtonProps {
  content: string
  variant?: "sent" | "received"
}

const CopyButton: React.FC<CopyButtonProps> = ({ content, variant }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success("Response copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  )
}

// Custom loading component with typing dots
const LoadingMessage: React.FC = () => {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 max-w-fit">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
      </div>
      <span className="text-sm text-gray-500">Thinking...</span>
    </div>
  )
}

export default function MessagesArea({ messages, isLoading, messagesEndRef }: MessagesAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 pt-20">
        {messages.length === 0 && (
          <motion.div className="text-center text-gray-600 mt-20" {...MOTION_CONFIG}>
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">Start a conversation!</p>
            <p className="text-sm text-gray-500">Ask about your insurance policies, claims, or upload documents.</p>
          </motion.div>
        )}

        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div key={message.id} {...MOTION_CONFIG} className="w-full group">
                <ChatBubble variant={message.role === "user" ? "sent" : "received"}>
                  <div className="flex items-start gap-2">
                    <ChatBubbleMessage 
                      variant={message.role === "user" ? "sent" : "received"} 
                      className="w-full max-w-none"
                    >
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown components={MarkdownComponents}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </ChatBubbleMessage>
                    
                    {message.role === "assistant" && (
                      <CopyButton content={message.content} variant="received" />
                    )}
                  </div>
                </ChatBubble>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div {...MOTION_CONFIG} className="flex justify-start">
              <LoadingMessage />
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}