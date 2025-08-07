"use client"

import { Button } from "@/components/ui/button"
import { Copy, Trash2, Download, X } from 'lucide-react'
import { motion } from "framer-motion"
import { useState } from "react"
import { toast } from "sonner"
import type { Message } from "@/types/chat"

interface BulkActionBarProps {
  selectedMessages: string[]
  messages: Message[]
  onClearSelection: () => void
  onDeleteSelected: () => void
  onExportSelected: () => void
}

export default function BulkActionBar({ 
  selectedMessages, 
  messages, 
  onClearSelection,
  onDeleteSelected,
  onExportSelected 
}: BulkActionBarProps) {
  const [copyFormat, setCopyFormat] = useState<'conversation' | 'list'>('conversation')

  const handleBulkCopy = async (format: 'conversation' | 'list') => {
    const selectedMessageObjects = messages.filter(m => selectedMessages.includes(m.id))
    
    let textToCopy = ''
    
    if (format === 'conversation') {
      textToCopy = selectedMessageObjects
        .map(m => {
          const timestamp = new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }).format(m.timestamp)
          return `[${timestamp}] ${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`
        })
        .join('\n\n')
    } else {
      textToCopy = selectedMessageObjects
        .map((m, index) => `${index + 1}. ${m.content}`)
        .join('\n\n')
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      toast.success(`${selectedMessages.length} messages copied in ${format} format`)
    } catch (error) {
      toast.error("Failed to copy messages")
    }
  }

  if (selectedMessages.length === 0) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center gap-4 backdrop-blur-sm">
        <div className="text-sm font-medium text-slate-700">
          {selectedMessages.length} message{selectedMessages.length !== 1 ? 's' : ''} selected
        </div>
        
        <div className="h-4 w-px bg-slate-300" />
        
        <div className="flex items-center gap-2">
          {/* Copy dropdown */}
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            
            {/* Copy format options */}
            <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-slate-200 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={() => handleBulkCopy('conversation')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 whitespace-nowrap"
              >
                Conversation Format
              </button>
              <button
                onClick={() => handleBulkCopy('list')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 whitespace-nowrap"
              >
                List Format
              </button>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportSelected}
            className="h-8 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDeleteSelected}
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>

        <div className="h-4 w-px bg-slate-300" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 p-0 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
