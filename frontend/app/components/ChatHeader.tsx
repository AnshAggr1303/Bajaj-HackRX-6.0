"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreVertical, Trash2, Download, Circle } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ExportModal from "./ExportModal"
import type { Message } from "@/types/chat"
import { Separator } from "@/components/ui/separator"

interface ChatHeaderProps {
  onClearHistory: () => void
  messages: Message[]
}

export default function ChatHeader({ 
  onClearHistory, 
  messages, 
}: ChatHeaderProps) {
  const router = useRouter()
  const [showExportModal, setShowExportModal] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setIsScrolled(currentScrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate dynamic opacity and blur based on scroll
  const scrollProgress = Math.min(scrollY / 100, 1)
  const backgroundOpacity = 0.95 + (scrollProgress * 0.05) // 95% to 100%
  const blurIntensity = Math.min(scrollY / 50, 1) // 0 to 1

  const recentExports = [
    { name: 'Insurance_Chat_2024-01-15.pdf', date: '2 hours ago', size: '2.1 MB' },
    { name: 'Claim_Analysis_2024-01-14.pdf', date: '1 day ago', size: '1.8 MB' },
    { name: 'Policy_Review_2024-01-13.pdf', date: '2 days ago', size: '3.2 MB' }
  ]

  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          isScrolled 
            ? 'backdrop-blur-md shadow-lg border-b border-slate-200/50' 
            : 'backdrop-blur-none shadow-none border-b border-transparent'
        }`}
        style={{
          backgroundColor: `rgba(250, 250, 250, ${backgroundOpacity})`,
          backdropFilter: `blur(${blurIntensity * 12}px)`,
        }}
      >
        {/* Gradient fade overlay for better content separation */}
        <div 
          className={`absolute inset-x-0 bottom-0 h-6 bg-gradient-to-b from-transparent transition-opacity duration-300 ${
            isScrolled ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: `linear-gradient(to bottom, transparent, rgba(250, 250, 250, ${backgroundOpacity * 0.8}))`
          }}
        />
        
        <div className={`flex items-center justify-between px-4 transition-all duration-300 ${
          isScrolled ? 'py-2' : 'py-4'
        }`}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className={`bg-[#fafafa]/80 hover:bg-[#fafafa] border-0 shadow-sm transition-all duration-300 ${
                isScrolled ? 'h-9 w-9' : 'h-10 w-10'
              }`}
            >
              <ArrowLeft className={`text-slate-600 transition-all duration-300 ${
                isScrolled ? 'h-4 w-4' : 'h-5 w-5'
              }`} />
            </Button>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className={`font-medium text-slate-900 transition-all duration-300 ${
                  isScrolled ? 'text-sm' : 'text-sm'
                }`}>
                  Policy #INS-2024-001
                </h2>
                <div className="flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-green-600 text-green-600" />
                  <span className={`text-slate-500 transition-all duration-300 ${
                    isScrolled ? 'text-xs opacity-75' : 'text-xs opacity-100'
                  }`}>
                    Online
                  </span>
                </div>
              </div>
              <p className={`text-slate-500 transition-all duration-300 ${
                isScrolled ? 'text-xs opacity-0 -translate-y-1' : 'text-xs opacity-100 translate-y-0'
              }`}>
                Professional Insurance Support
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`hover:bg-accent/50 transition-all duration-300 ${
                    isScrolled ? 'h-9 w-9' : 'h-10 w-10'
                  }`}
                >
                  <MoreVertical className={`text-slate-600 transition-all duration-300 ${
                    isScrolled ? 'h-4 w-4' : 'h-5 w-5'
                  }`} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => setShowExportModal(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </DropdownMenuItem>

                {recentExports.length > 0 && (
                  <>
                    <Separator className="my-1" />
                    <div className="px-2 py-1.5 text-xs font-medium text-slate-500">
                      Recent Exports
                    </div>
                    {recentExports.slice(0, 2).map((export_, index) => (
                      <DropdownMenuItem key={index} className="flex-col items-start py-2">
                        <div className="flex items-center w-full">
                          <Download className="mr-2 h-3 w-3 text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-700 truncate">
                              {export_.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {export_.date} • {export_.size}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                <Separator className="my-1" />
                <DropdownMenuItem onClick={onClearHistory} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        messages={messages}
      />
    </>
  )
}
