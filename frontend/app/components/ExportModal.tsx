"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, FileText, Download, Calendar, Filter, Settings, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import type { Message } from "@/types/chat"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  selectedMessages?: string[]
}

export default function ExportModal({ isOpen, onClose, messages, selectedMessages }: ExportModalProps) {
  const [exportScope, setExportScope] = useState<'all' | 'selected' | 'recent' | 'custom'>('all')
  const [contentFilters, setContentFilters] = useState({
    timestamps: true,
    userMessages: true,
    aiResponses: true,
    attachments: true
  })
  const [formatStyle, setFormatStyle] = useState<'professional' | 'transcript' | 'summary'>('professional')
  const [customization, setCustomization] = useState({
    claimNumber: '',
    policyNumber: '',
    includeHeader: true,
    includeFooter: true,
    pageNumbers: true
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportComplete, setExportComplete] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    // Simulate export process
    const steps = ['Preparing PDF...', 'Formatting content...', 'Adding customizations...', 'Finalizing document...']
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setExportProgress((i + 1) * 25)
    }

    setIsExporting(false)
    setExportComplete(true)
    
    // Reset after showing success
    setTimeout(() => {
      setExportComplete(false)
      onClose()
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-slate-900">Export Conversation</h2>
              <p className="text-sm text-slate-500">Generate a professional PDF report</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Scope */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-3 block">Export Scope</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'all', label: 'Entire Conversation', desc: `${messages.length} messages` },
                { value: 'selected', label: 'Selected Messages', desc: `${selectedMessages?.length || 0} selected` },
                { value: 'recent', label: 'Last 24 Hours', desc: 'Recent activity' },
                { value: 'custom', label: 'Custom Range', desc: 'Choose dates' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setExportScope(option.value as any)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    exportScope === option.value
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-900">{option.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Filters */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-3 block flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Content Filters
            </label>
            <div className="space-y-2">
              {[
                { key: 'timestamps', label: 'Include timestamps' },
                { key: 'userMessages', label: 'User messages' },
                { key: 'aiResponses', label: 'AI responses' },
                { key: 'attachments', label: 'File attachments' }
              ].map((filter) => (
                <label key={filter.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={contentFilters[filter.key as keyof typeof contentFilters]}
                    onChange={(e) => setContentFilters(prev => ({
                      ...prev,
                      [filter.key]: e.target.checked
                    }))}
                    className="w-4 h-4 text-slate-700 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">{filter.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format Style */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-3 block">PDF Layout Style</label>
            <div className="space-y-2">
              {[
                { value: 'professional', label: 'Professional Report', desc: 'Formatted sections with letterhead area' },
                { value: 'transcript', label: 'Conversation Transcript', desc: 'Chat bubble appearance preserved' },
                { value: 'summary', label: 'Summary Format', desc: 'Key points extracted and structured' }
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => setFormatStyle(style.value as any)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    formatStyle === style.value
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-900">{style.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Customization */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-3 block flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Document Customization
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Claim Number</label>
                  <input
                    type="text"
                    value={customization.claimNumber}
                    onChange={(e) => setCustomization(prev => ({ ...prev, claimNumber: e.target.value }))}
                    placeholder="CLM-2024-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">Policy Number</label>
                  <input
                    type="text"
                    value={customization.policyNumber}
                    onChange={(e) => setCustomization(prev => ({ ...prev, policyNumber: e.target.value }))}
                    placeholder="INS-2024-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'includeHeader', label: 'Include header' },
                  { key: 'includeFooter', label: 'Include footer' },
                  { key: 'pageNumbers', label: 'Page numbers' }
                ].map((option) => (
                  <label key={option.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customization[option.key as keyof typeof customization] as boolean}
                      onChange={(e) => setCustomization(prev => ({
                        ...prev,
                        [option.key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-slate-700 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <AnimatePresence mode="wait">
            {exportComplete ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-3 text-green-600"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">PDF exported successfully!</span>
              </motion.div>
            ) : isExporting ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Preparing PDF...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-slate-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
              >
                <div className="text-sm text-slate-600">
                  <div>File: Insurance_Chat_{new Date().toISOString().split('T')[0]}.pdf</div>
                  <div className="text-xs text-slate-500 mt-1">Estimated size: ~2.3 MB</div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleExport} className="bg-slate-700 hover:bg-slate-800">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
