"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Paperclip, X, ChevronDown, ChevronUp, Loader2, FileText, Image, File } from 'lucide-react'
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onFileUpload: (file: File) => void
  disabled?: boolean
}

const suggestedQuestions = [
  "What's my deductible?",
  "File new claim",
  "Claim status"
]

export default function ChatInput({ onSendMessage, onFileUpload, disabled }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const characterLimit = 500
  const characterCount = input.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedFile && !input.trim()) {
      await handleFileUpload()
      return
    }
    
    if (!input.trim()) return

    onSendMessage(input.trim())
    setInput("")
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    
    if (selectedFile) {
      await handleFileUpload()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        handleSubmit(e as any)
      }
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 100)
    
    try {
      await onFileUpload(selectedFile)
      setUploadProgress(100)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast.error("Failed to upload file")
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    textareaRef.current?.focus()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />
    if (fileType.includes('image')) return <Image className="h-4 w-4 text-blue-600" />
    return <File className="h-4 w-4 text-slate-600" />
  }

  const getFileTypeBadge = (fileType: string) => {
    if (fileType.includes('pdf')) return <Badge variant="destructive" className="text-xs">PDF</Badge>
    if (fileType.includes('image')) return <Badge variant="default" className="text-xs">Image</Badge>
    if (fileType.includes('word')) return <Badge variant="secondary" className="text-xs">Word</Badge>
    return <Badge variant="outline" className="text-xs">Document</Badge>
  }

  return (
    <TooltipProvider>
      <div className="flex-shrink-0 bg-[#fafafa] pb-4">
        <div className="max-w-4xl mx-auto px-4">
          {/* Quick Questions */}
          {showSuggestions && (
            <div className="mb-4">
              <div className="flex justify-center mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(false)}
                  className="text-slate-500 hover:text-slate-700 text-xs h-7"
                >
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Hide suggestions
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(question)}
                      className="border-neutral-200 bg-white/30 hover:bg-neutral-200/30 backdrop-blur-lg rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-95 text-xs h-8 px-4 py-2"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!showSuggestions && (
            <div className="mb-4 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(true)}
                className="text-slate-500 hover:text-slate-700 text-xs h-7"
              >
                <ChevronDown className="w-3 h-3 mr-1" />
                Show suggestions
              </Button>
            </div>
          )}

          {/* File attachment preview */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-4 max-w-lg mx-auto"
              >
                <div className="border border-neutral-200 bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      {getFileIcon(selectedFile.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {selectedFile.name}
                        </div>
                        {getFileTypeBadge(selectedFile.type)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatFileSize(selectedFile.size)}
                      </div>
                      {isUploading && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFile}
                      disabled={isUploading}
                      className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg flex-shrink-0"
                    >
                      <X className="h-4 w-4 text-slate-500" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Input Container - Inspired by portfolio design */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full max-w-2xl mx-auto"
          >
            <form onSubmit={handleSubmit} className="relative">
              <div className={`mx-auto flex items-center rounded-full border border-neutral-200 bg-white py-2.5 pr-2 pl-6 shadow-sm transition-all hover:border-neutral-300 ${
                isInputFocused ? 'border-neutral-400' : ''
              }`}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    if (e.target.value.length <= characterLimit) {
                      setInput(e.target.value)
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={selectedFile ? "Add a message (optional)" : "Ask about your insurance policy..."}
                  disabled={disabled || isUploading}
                  className="w-full border-none bg-transparent text-base text-black placeholder:text-gray-500 focus:outline-none disabled:opacity-50"
                />
                
                {/* Document Upload Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled || isUploading}
                      className="mr-2 flex items-center justify-center rounded-full p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                      {selectedFile && !isUploading && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-slate-700 rounded-full border-2 border-white" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload document (PDF, Word, Image)</p>
                  </TooltipContent>
                </Tooltip>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  className="hidden"
                />

                {/* Send Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="submit"
                      disabled={disabled || isUploading || (!input.trim() && !selectedFile)}
                      className="flex items-center justify-center rounded-full bg-slate-700 p-2.5 text-white transition-colors hover:bg-slate-800 disabled:opacity-70"
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-5 w-5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send message (Enter)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Character counter */}
              {characterCount > characterLimit * 0.8 && (
                <div className="text-center mt-2">
                  <Badge variant={characterCount > characterLimit * 0.95 ? "destructive" : "secondary"} className="text-xs">
                    {characterCount}/{characterLimit}
                  </Badge>
                </div>
              )}
            </form>
          </motion.div>

          {/* Professional disclaimer */}
          <div className="text-center mt-3">
            <p className="text-xs text-slate-400">
              AI responses are for informational purposes. For official determinations, contact your agent.
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
