"use client"

import type React from "react"
import { MessageCircle, Copy, Check, Clock, MoreHorizontal, FileText, Hash, DollarSign } from 'lucide-react'
import ReactMarkdown from "react-markdown"
import type { Message } from "@/types/chat"
import { ChatBubble, ChatBubbleMessage, ChatBubbleActionWrapper, ChatBubbleAction } from "@/components/ui/chat/chat-bubble"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

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
    duration: 0.2,
    ease: "easeOut" as const,
  },
}

// Custom components for ReactMarkdown
const MarkdownComponents = {
  code: ({ node, inline, className, children, ...props }: any) => {
    if (!inline) {
      return (
        <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 my-4 overflow-x-auto">
          <code className="text-sm font-mono" {...props}>
            {String(children).replace(/\n$/, '')}
          </code>
        </pre>
      )
    }
    
    return (
      <code 
        className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono" 
        {...props}
      >
        {children}
      </code>
    )
  },
  p: ({ children }: any) => (
    <p className="mb-3 last:mb-0 leading-7">{children}</p>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-medium mb-4 text-slate-900">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-medium mb-3 text-slate-900">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-medium mb-2 text-slate-900">{children}</h3>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm leading-7">{children}</li>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-700">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a 
      href={href} 
      className="text-slate-700 hover:underline font-medium" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  strong: ({ children }: any) => (
    <strong className="font-medium text-slate-900">{children}</strong>
  ),
}

export default function MessagesArea({ 
  messages, 
  isLoading, 
  messagesEndRef, 
}: MessagesAreaProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Track scroll position for header fade effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCopy = async (content: string, messageId: string, format: 'plain' | 'timestamp' | 'structured' = 'plain') => {
    try {
      let textToCopy = content
      
      if (format === 'timestamp') {
        const message = messages.find(m => m.id === messageId)
        const timestamp = message ? formatTimestamp(message.timestamp) : ''
        textToCopy = `[${timestamp}] ${content}`
      } else if (format === 'structured' && content.includes('**')) {
        // Keep markdown formatting for structured content
        textToCopy = content
      }

      await navigator.clipboard.writeText(textToCopy)
      setCopiedId(messageId)
      
      const preview = content.substring(0, 30) + (content.length > 30 ? '...' : '')
      toast.success(`Message copied: "${preview}"`)
      
      setTimeout(() => setCopiedId(null), 2000)
      setContextMenu(null)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleRightClick = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId
    })
  }

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  // Extract structured data for smart copy
  const extractClaimDetails = (content: string) => {
    const details: { [key: string]: string } = {}
    
    // Extract policy numbers
    const policyMatch = content.match(/Policy #([A-Z0-9-]+)/i)
    if (policyMatch) details.policy = policyMatch[1]
    
    // Extract claim amounts
    const amountMatch = content.match(/\$([0-9,]+(?:\.[0-9]{2})?)/g)
    if (amountMatch) details.amount = amountMatch[0]
    
    // Extract reference numbers
    const refMatch = content.match(/Reference: ([A-Z0-9-]+)/i)
    if (refMatch) details.reference = refMatch[1]
    
    return details
  }

  const handleSmartCopy = async (messageId: string, type: 'claim' | 'policy' | 'amount' | 'reference') => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    const details = extractClaimDetails(message.content)
    let textToCopy = ''

    switch (type) {
      case 'policy':
        textToCopy = details.policy || 'No policy number found'
        break
      case 'amount':
        textToCopy = details.amount || 'No amount found'
        break
      case 'reference':
        textToCopy = details.reference || 'No reference found'
        break
      case 'claim':
        textToCopy = Object.entries(details)
          .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
          .join('\n')
        break
    }

    if (textToCopy && textToCopy !== 'No policy number found' && textToCopy !== 'No amount found' && textToCopy !== 'No reference found') {
      await navigator.clipboard.writeText(textToCopy)
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} details copied`)
    } else {
      toast.error(`No ${type} details found in this message`)
    }
  }

  // Calculate fade gradient opacity based on scroll
  const fadeOpacity = Math.min(scrollY / 100, 0.8)

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa] relative">
      {/* Top fade gradient for header blend */}
      <div 
        className="fixed top-0 left-0 right-0 h-32 pointer-events-none z-40 transition-opacity duration-300"
        style={{
          background: `linear-gradient(to bottom, rgba(250, 250, 250, ${fadeOpacity}), transparent)`,
          opacity: scrollY > 20 ? 1 : 0
        }}
      />
      
      <div className="max-w-3xl mx-auto px-4 py-6 pt-28 relative">
        {messages.length === 0 && (
          <motion.div className="text-center text-slate-600 mt-20" {...MOTION_CONFIG}>
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
              <MessageCircle className="w-10 h-10 text-slate-700" />
            </div>
            <h2 className="text-2xl font-medium text-slate-800 mb-3">Professional Insurance Support</h2>
            <p className="text-lg text-slate-600 max-w-md mx-auto leading-7">
              Ask questions about your policies, file claims, or upload documents for expert assistance.
            </p>
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => {
              const claimDetails = extractClaimDetails(message.content)
              const hasStructuredData = Object.keys(claimDetails).length > 0

              return (
                <motion.div key={message.id} {...MOTION_CONFIG}>
                  <div className="relative">
                    <div 
                      className="transition-all duration-200"
                      onContextMenu={(e) => handleRightClick(e, message.id)}
                    >
                      <ChatBubble variant={message.role === "user" ? "sent" : "received"}>
                        <ChatBubbleMessage 
                          variant={message.role === "user" ? "sent" : "received"}
                          className="max-w-none relative"
                        >
                          {/* Copy icon on hover */}
                          {hoveredMessage === message.id && (
                            <button
                              onClick={() => handleCopy(message.content, message.id)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                            >
                              {copiedId === message.id ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-slate-600" />
                              )}
                            </button>
                          )}

                          <div 
                            className="prose prose-sm max-w-none"
                            onMouseEnter={() => setHoveredMessage(message.id)}
                            onMouseLeave={() => setHoveredMessage(null)}
                          >
                            {message.insuranceData ? (
                              <div className="border border-neutral-200 bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-medium text-slate-900">
                                    Insurance Analysis
                                  </h3>
                                  <div className="flex gap-2">
                                    <Badge variant={
                                      message.insuranceData.decision.toLowerCase().includes('approved') ? 'default' :
                                      message.insuranceData.decision.toLowerCase().includes('denied') ? 'destructive' :
                                      'secondary'
                                    }>
                                      {message.insuranceData.decision}
                                    </Badge>
                                    {message.insuranceData.confidence_score && (
                                      <Badge variant="outline">
                                        {Math.round(message.insuranceData.confidence_score * 100)}% Confidence
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  {message.insuranceData.amount && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                      <div className="text-sm text-slate-600 mb-1">Coverage Amount</div>
                                      <div className="text-2xl font-semibold text-slate-900">
                                        ${message.insuranceData.amount.toLocaleString()}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <div className="text-sm font-medium text-slate-900 mb-2">Analysis</div>
                                    <p className="text-sm text-slate-700 leading-6">
                                      {message.insuranceData.justification}
                                    </p>
                                  </div>

                                  {message.insuranceData.referenced_clauses && message.insuranceData.referenced_clauses.length > 0 && (
                                    <>
                                      <Separator />
                                      <div>
                                        <div className="text-sm font-medium text-slate-900 mb-2">Policy References</div>
                                        <ul className="space-y-1">
                                          {message.insuranceData.referenced_clauses.map((clause, index) => (
                                            <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                                              {clause}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </>
                                  )}

                                  {message.insuranceData.additional_info?.sources && (
                                    <>
                                      <Separator />
                                      <div>
                                        <div className="text-sm font-medium text-slate-900 mb-2">Documentation Reviewed</div>
                                        <div className="flex flex-wrap gap-2">
                                          {message.insuranceData.additional_info.sources.map((source, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {source}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  <Alert>
                                    <AlertDescription className="text-xs">
                                      This analysis is based on your current policy terms and conditions. For official determinations, please contact our claims department.
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              </div>
                            ) : (
                              <ReactMarkdown components={MarkdownComponents}>
                                {message.content}
                              </ReactMarkdown>
                            )}
                          </div>

                          {/* Smart copy buttons for structured data */}
                          {hasStructuredData && message.role === "assistant" && (
                            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                              <span className="text-xs text-slate-500 w-full mb-1">Quick Copy:</span>
                              {claimDetails.policy && (
                                <button
                                  onClick={() => handleSmartCopy(message.id, 'policy')}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-xs text-slate-700 transition-colors"
                                >
                                  <Hash className="h-3 w-3" />
                                  Policy #
                                </button>
                              )}
                              {claimDetails.amount && (
                                <button
                                  onClick={() => handleSmartCopy(message.id, 'amount')}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-xs text-slate-700 transition-colors"
                                >
                                  <DollarSign className="h-3 w-3" />
                                  Amount
                                </button>
                              )}
                              {claimDetails.reference && (
                                <button
                                  onClick={() => handleSmartCopy(message.id, 'reference')}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-xs text-slate-700 transition-colors"
                                >
                                  <FileText className="h-3 w-3" />
                                  Reference
                                </button>
                              )}
                            </div>
                          )}
                        </ChatBubbleMessage>
                      </ChatBubble>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {isLoading && (
            <motion.div {...MOTION_CONFIG}>
              <ChatBubble variant="received">
                <ChatBubbleMessage variant="received" isLoading />
              </ChatBubble>
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 py-2 z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const message = messages.find(m => m.id === contextMenu.messageId)
              if (message) handleCopy(message.content, contextMenu.messageId, 'plain')
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Message
          </button>
          <button
            onClick={() => {
              const message = messages.find(m => m.id === contextMenu.messageId)
              if (message) handleCopy(message.content, contextMenu.messageId, 'timestamp')
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Copy with Timestamp
          </button>
          <button
            onClick={() => {
              const message = messages.find(m => m.id === contextMenu.messageId)
              if (message) handleCopy(message.content, contextMenu.messageId, 'structured')
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Copy as Plain Text
          </button>
        </div>
      )}
    </div>
  )
}
