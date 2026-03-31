"use client"

import { motion } from "framer-motion"

export default function AISpeakingBars() {
  const bars = Array.from({ length: 14 })

  return (
    <div className="flex items-center gap-[3px] h-8 justify-center">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          initial={{ height: 4 }}
          animate={{ 
            height: [6, 24, 10, 20, 8, 16, 6],
            opacity: [0.4, 1, 0.6, 1, 0.5, 0.9, 0.4]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
          aria-hidden
        />
      ))}
      <span className="sr-only">AI is speaking</span>
    </div>
  )
}
