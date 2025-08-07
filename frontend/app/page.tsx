"use client"

import { Button } from "@/components/ui/button"
import { GithubButton } from "@/components/ui/github-button"
import { motion } from "framer-motion"
import { ArrowRight, FileText, Shield, Upload, CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import InitialLoadingScreen from "./components/InitialLoadingScreen"

/* ---------- sample insurance questions ---------- */
const insuranceQuestions = {
  Coverage: "Does my policy cover flood damage?",
  Claim: "How do I file a claim?",
  Documents: "What documents do I need?",
  Status: "Check my claim status",
} as const

const questionConfig = [
  { key: "Coverage", color: "hsl(214, 84%, 36%)", icon: Shield },
  { key: "Claim", color: "hsl(214, 84%, 36%)", icon: FileText },
  { key: "Documents", color: "hsl(214, 84%, 36%)", icon: Upload },
  { key: "Status", color: "hsl(214, 84%, 36%)", icon: CheckCircle },
] as const

/* ---------- component ---------- */
export default function Home() {
  const [input, setInput] = useState("")
  const [isNavigating, setIsNavigating] = useState(false)
  const [loadingQuery, setLoadingQuery] = useState<string | null>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const goToChat = async (query: string) => {
    setIsNavigating(true)
    setLoadingQuery(query)
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300))
    
    router.push(`/chat?query=${encodeURIComponent(query)}`)
  }

  /* hero animations */
  const topElementVariants = {
    hidden: { opacity: 0, y: -60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { ease: "easeOut", duration: 0.8 },
    },
  }
  const bottomElementVariants = {
    hidden: { opacity: 0, y: 80 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { ease: "easeOut", duration: 0.8, delay: 0.2 },
    },
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-10 md:pb-20 bg-background">
      {/* Loading Overlay */}
      {isNavigating && <InitialLoadingScreen query={loadingQuery || undefined} />}

      {/* GitHub button */}
      <div className="absolute top-6 right-8 z-20">
        <GithubButton
          animationDuration={1.5}
          label="GitHub Repo"
          size="sm"
          repoUrl="https://github.com/AnshAggr1303/Bajaj-HackRX-6.0"
        />
      </div>

      {/* Status indicator */}
      <div className="absolute top-6 left-6 z-20">
        <motion.div
          className="relative flex cursor-default items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground shadow-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Green pulse dot */}
          <span className="relative flex h-2 w-2">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-green-400"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          Insurance Support Online
        </motion.div>
      </div>

      {/* Header */}
      <motion.div
        className="z-10 mt-24 mb-8 flex flex-col items-center text-center md:mt-4 md:mb-12"
        variants={topElementVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-4 inline-flex items-center rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
          <Shield className="mr-2 h-4 w-4 text-primary" />
          Professional Insurance Assistant
        </div>
        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl mb-4 text-foreground">
          HackRx6.0
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-7">
          Get instant answers about your insurance policies, file claims, and upload documents with our intelligent assistant
        </p>
      </motion.div>

      {/* Input + Quick Buttons */}
      <motion.div
        variants={bottomElementVariants}
        initial="hidden"
        animate="visible"
        className="z-10 mt-4 flex w-full flex-col items-center justify-center md:px-0"
      >
        {/* Free-form question */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim() && !isNavigating) goToChat(input.trim())
          }}
          className="relative w-full max-w-lg mb-8"
        >
          <div className="mx-auto flex items-center rounded-full border border-border bg-input py-2.5 pr-2 pl-6 shadow-sm transition-all hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your insurance policy..."
              disabled={isNavigating}
              className="w-full border-none bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isNavigating}
              aria-label="Submit question"
              className="flex items-center justify-center rounded-full bg-primary p-2.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isNavigating && loadingQuery === input.trim() ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>

        {/* Quick-question grid */}
        <div className="grid w-full max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
          {questionConfig.map(({ key, color, icon: Icon }) => (
            <Button
              key={key}
              onClick={() => goToChat(insuranceQuestions[key])}
              disabled={isNavigating}
              variant="outline"
              className="h-24 w-full cursor-pointer rounded-2xl border-border bg-card/50 py-6 shadow-sm hover:shadow-md hover:border-primary/50 hover:bg-accent active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
            >
              <div className="flex h-full flex-col items-center justify-center gap-2 text-foreground">
                {isNavigating && loadingQuery === insuranceQuestions[key] ? (
                  <>
                    <Loader2 size={22} className="animate-spin text-primary" />
                    <span className="text-xs font-medium sm:text-sm">Loading...</span>
                  </>
                ) : (
                  <>
                    <Icon size={22} strokeWidth={2} className="text-primary" />
                    <span className="text-xs font-medium sm:text-sm">{key}</span>
                  </>
                )}
              </div>
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
