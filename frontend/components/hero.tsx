"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function Hero() {
  const fullText = "Master your future with Neuraview AI"
  const [typed, setTyped] = useState("")

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setTyped(fullText.slice(0, i))
      if (i >= fullText.length) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative text-center max-w-4xl mx-auto">
      {/* <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8"
      >
        <Sparkles className="h-4 w-4" />
        <span>Powered by Next-Gen AI Models</span>
      </motion.div> */}
      
      <motion.h1
        className="text-balance text-red-300 text-2xl font-extrabold tracking-tight md:text-6xl lg:text-7xl mb-8 leading-[1.1] min-h-[1.2em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        aria-label="Neuraview: The most powerful AI-powered platform for mastering interviews"
      >
        <span className="text-white">{typed || "Neuraview: The most powerful platform for mastering interviews"}</span>
        <span className="text-blue-500 animate-pulse">|</span>
      </motion.h1>

      <motion.p
        className="mx-auto max-w-2xl text-lg text-slate-400 md:text-xl lg:text-2xl leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Practice transformative interview experiences powered by industry-leading AI models. 
        Get real-time feedback on your confidence, tone, and technical skills.
      </motion.p>
    </div>
  )
}
