"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import ChatHeader from "../components/ChatHeader"
import MessagesArea from "../components/MessagesArea"
import ChatInput from "../components/ChatInput"
import { Message } from "@/types/chat"
import { processInsuranceQuery, uploadDocument } from "@/lib/api"
import { toast } from "sonner"
import { AnimatePresence } from "framer-motion"

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialQueryProcessed = useRef(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const initialQuery = searchParams.get('query')
    if (initialQuery && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true
      handleSendMessage(initialQuery)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await processInsuranceQuery(content.trim())
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: formatInsuranceResponse(response),
        timestamp: new Date(),
        insuranceData: response,
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error processing query:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm experiencing technical difficulties processing your request. Please try again in a moment, or contact our support team if the issue persists.\n\n**Error Reference:** ERR-" + Date.now().toString().slice(-6),
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
      toast.error("Unable to process your request at this time")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const response = await uploadDocument(file)
      
      const uploadMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `**Document Upload Successful**\n\nFile: "${file.name}"\nStatus: Processed and indexed\nReference: DOC-${Date.now().toString().slice(-6)}\n\nYour document has been successfully added to your policy database and is now available for analysis and reference.`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, uploadMessage])
      toast.success(`Document "${file.name}" uploaded successfully`)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error("Document upload failed. Please try again.")
    }
  }

  const formatInsuranceResponse = (data: any): string => {
    const { decision, amount, justification, referenced_clauses, confidence_score, additional_info } = data

    let response = `**Decision:** ${decision}\n\n`
    
    if (amount && amount > 0) {
      response += `**Coverage Amount:** $${amount.toLocaleString()}\n\n`
    }
    
    response += `**Analysis:**\n${justification}\n\n`
    
    if (referenced_clauses && referenced_clauses.length > 0) {
      response += `**Policy References:**\n${referenced_clauses.map((clause: string) => `• ${clause}`).join('\n')}\n\n`
    }
    
    if (confidence_score) {
      const confidencePercent = Math.round(confidence_score * 100)
      const confidenceLevel = confidence_score >= 0.9 ? "High Confidence" : 
                             confidence_score >= 0.7 ? "Moderate Confidence" : "Low Confidence"
      response += `**Assessment Confidence:** ${confidenceLevel} (${confidencePercent}%)\n\n`
    }
    
    if (additional_info?.sources && additional_info.sources.length > 0) {
      response += `**Documentation Reviewed:**\n${additional_info.sources.map((source: string) => `• ${source}`).join('\n')}\n\n`
    }

    response += `*This analysis is based on your current policy terms and conditions. For official determinations, please contact our claims department.*`

    return response
  }

  const clearHistory = () => {
    setMessages([])
    initialQueryProcessed.current = false
    toast.success("Conversation history cleared")
  }

  return (
    <div className="flex h-screen flex-col bg-[#fafafa]">
      <ChatHeader 
        onClearHistory={clearHistory}
        messages={messages}
      />
      <MessagesArea 
        messages={messages} 
        isLoading={isLoading} 
        messagesEndRef={messagesEndRef}
      />
      <ChatInput 
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={isLoading}
      />
    </div>
  )
}
