"use client"

import { Button } from "@/components/ui/button"
import { GithubButton } from "@/components/ui/github-button"
import { motion } from "framer-motion"
import { ArrowRight, FileText, Shield, Upload, CheckCircle, Loader2 } from "lucide-react"
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
  { key: "Coverage", color: "#329696", icon: Shield },
  { key: "Claim", color: "#3E9858", icon: FileText },
  { key: "Documents", color: "#856ED9", icon: Upload },
  { key: "Status", color: "#C19433", icon: CheckCircle },
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-10 md:pb-20">
      {/* Loading Overlay */}
      {isNavigating && <InitialLoadingScreen query={loadingQuery || undefined} />}

      {/* big blurred footer word */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden">
        <div
          className="hidden bg-gradient-to-b from-neutral-500/10 to-neutral-500/0 bg-clip-text text-[10rem] leading-none font-black text-transparent select-none sm:block lg:text-[16rem]"
          style={{ marginBottom: "-2.5rem" }}
        >
          Insurance
        </div>
      </div>

      {/* GitHub button */}
      <div className="absolute top-6 right-8 z-20">
        <GithubButton
          animationDuration={1.5}
          label="GitHub Repo"
          size={"sm"}
          repoUrl="https://github.com/AnshAggr1303/ai-portfolio"
        />
      </div>

      {/* header */}
      <motion.div
        className="z-1 mt-24 mb-8 flex flex-col items-center text-center md:mt-4 md:mb-12"
        variants={topElementVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-secondary-foreground mt-1 text-xl font-semibold md:text-2xl">Your Insurance Claim Assistant 🛡️</h2>
        <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">HackRx6.0</h1>
      </motion.div>

      {/* input + quick buttons */}
      <motion.div
        variants={bottomElementVariants}
        initial="hidden"
        animate="visible"
        className="z-10 mt-4 flex w-full flex-col items-center justify-center md:px-0"
      >
        {/* free-form question */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim() && !isNavigating) goToChat(input.trim())
          }}
          className="relative w-full max-w-lg"
        >
          <div className="mx-auto flex items-center rounded-full border border-neutral-200 bg-white py-2.5 pr-2 pl-6 shadow-sm transition-all hover:border-neutral-300">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your insurance policy..."
              disabled={isNavigating}
              className="w-full border-none bg-transparent text-base text-black placeholder:text-gray-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isNavigating}
              aria-label="Submit question"
              className="flex items-center justify-center rounded-full bg-[#0171E3] p-2.5 text-white transition-colors hover:bg-blue-600 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isNavigating && loadingQuery === input.trim() ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>

        {/* quick-question grid */}
        <div className="mt-4 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {questionConfig.map(({ key, color, icon: Icon }) => (
            <Button
              key={key}
              onClick={() => goToChat(insuranceQuestions[key])}
              disabled={isNavigating}
              variant="outline"
              className="border-border hover:bg-border/30 aspect-square w-full cursor-pointer rounded-2xl border bg-white/30 py-8 shadow-none backdrop-blur-lg active:scale-95 md:p-10 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-700">
                {isNavigating && loadingQuery === insuranceQuestions[key] ? (
                  <>
                    <Loader2 size={22} className="animate-spin" color={color} />
                    <span className="text-xs font-medium sm:text-sm">Loading...</span>
                  </>
                ) : (
                  <>
                    <Icon size={22} strokeWidth={2} color={color} />
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