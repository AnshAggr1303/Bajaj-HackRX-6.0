"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import ChatHeader from "./components/ChatHeader"
import MessagesArea from "./components/MessagesArea"
import ChatInput from "./components/ChatInput"
import { Message } from "@/types/chat"
import { processInsuranceQuery, uploadDocument } from "@/lib/api"
import { toast } from "sonner"

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
        content: "I apologize, but I'm having trouble processing your request right now. Please try again later or contact support if the issue persists.",
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, errorMessage])
      toast.error("Failed to process your query. Please try again.")
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
        content: `✅ Successfully uploaded "${file.name}". The document has been processed and added to your policy database.`,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, uploadMessage])
      toast.success(`Document "${file.name}" uploaded successfully!`)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error("Failed to upload document. Please try again.")
    }
  }

  const formatInsuranceResponse = (data: any): string => {
    const { decision, amount, justification, referenced_clauses, confidence_score, additional_info } = data

    let response = `**Decision:** ${decision}\n\n`
    
    if (amount && amount > 0) {
      response += `**Amount:** $${amount.toLocaleString()}\n\n`
    }
    
    response += `**Justification:**\n${justification}\n\n`
    
    if (referenced_clauses && referenced_clauses.length > 0) {
      response += `**Referenced Policy Sections:**\n${referenced_clauses.map((clause: string) => `• ${clause}`).join('\n')}\n\n`
    }
    
    if (confidence_score) {
      const confidencePercent = Math.round(confidence_score * 100)
      response += `**Confidence Level:** ${confidencePercent}% ${getConfidenceEmoji(confidence_score)}\n\n`
    }
    
    if (additional_info?.sources && additional_info.sources.length > 0) {
      response += `**Sources Consulted:**\n${additional_info.sources.map((source: string) => `• ${source}`).join('\n')}`
    }

    return response
  }

  const getConfidenceEmoji = (score: number): string => {
    if (score >= 0.9) return "🟢"
    if (score >= 0.7) return "🟡"
    return "🔴"
  }

  const clearHistory = () => {
    setMessages([])
    initialQueryProcessed.current = false // Reset the flag when history is cleared
    toast.success("Chat history cleared!")
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <ChatHeader onClearHistory={clearHistory} />
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