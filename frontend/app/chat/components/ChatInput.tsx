"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Paperclip, X } from "lucide-react"
import { toast } from "sonner"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onFileUpload: (file: File) => void
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, onFileUpload, disabled }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedFile && !input.trim()) {
      // Handle file upload without message
      await handleFileUpload()
      return
    }
    
    if (!input.trim()) return

    onSendMessage(input.trim())
    setInput("")
    
    // If there's a file selected, upload it after sending the message
    if (selectedFile) {
      await handleFileUpload()
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    try {
      await onFileUpload(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast.error("Failed to upload file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (accept PDFs and common document types)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload PDF, Word document, text file, or image")
      e.target.value = ""
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      e.target.value = ""
      return
    }

    setSelectedFile(file)
    toast.success(`File "${file.name}" selected`)
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
  e.preventDefault()
  // Let form submission handle it
}
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* File attachment preview */}
        {selectedFile && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-gray-50 p-2">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700 flex-1 truncate">
              {selectedFile.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeSelectedFile}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                adjustTextareaHeight()
              }}
              onKeyDown={handleKeyDown}
              placeholder={selectedFile ? "Add a message (optional)" : "Ask about your insurance policy..."}
              disabled={disabled || isUploading}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {/* File upload button inside textarea */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-200"
            >
              <Paperclip className="h-4 w-4 text-gray-500" />
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              className="hidden"
            />
          </div>

          <Button
            type="submit"
            disabled={disabled || isUploading || (!input.trim() && !selectedFile)}
            className="h-11 w-11 rounded-full bg-[#0171E3] p-0 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}