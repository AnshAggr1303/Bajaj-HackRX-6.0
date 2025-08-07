"use client"

import { Button } from "@/components/ui/button"
import { Github } from 'lucide-react'
import { motion } from "framer-motion"

interface GithubButtonProps {
  repoUrl: string
  label?: string
  size?: "sm" | "md" | "lg"
  animationDuration?: number
}

export function GithubButton({ 
  repoUrl = "https://github.com/AnshAggr1303/Bajaj-HackRX-6.0", 
  label = "GitHub", 
  size = "md",
  animationDuration = 1 
}: GithubButtonProps) {
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm", 
    lg: "h-12 px-6 text-base"
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationDuration, ease: "easeOut" }}
    >
      <Button
        variant="outline"
        size={size}
        className={`${sizeClasses[size]} bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 transition-colors`}
        onClick={() => window.open(repoUrl, '_blank')}
      >
        <Github size={iconSizes[size]} className="mr-2" />
        {label}
      </Button>
    </motion.div>
  )
}
