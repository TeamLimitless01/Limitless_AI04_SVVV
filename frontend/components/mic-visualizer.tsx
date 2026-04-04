"use client"

import { motion } from "framer-motion"

export default function MicVisualizer({ active, volume = 0 }: { active: boolean, volume?: number }) {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {/* Outer Glow Ring */}
      {active && (
        <>
          <motion.div
            animate={{ 
              scale: 1 + volume * 1.5,
              opacity: volume > 0.01 ? 0.3 : 0.1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute w-full h-full rounded-full border-2 border-red-500/30"
          />
          <motion.div
            animate={{ 
              scale: 1 + volume * 3,
              opacity: volume > 0.01 ? 0.2 : 0.05
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.05 }}
            className="absolute w-full h-full rounded-full border border-red-500/20"
          />
        </>
      )}

      {/* Main Core */}
      <motion.div
        animate={active ? { 
          scale: 1 + volume * 0.5,
          backgroundColor: volume > 0.1 ? "#ef4444" : "#dc2626"
        } : { 
          scale: 1,
          backgroundColor: "rgba(255, 255, 255, 0.05)"
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`w-16 h-16 rounded-full flex items-center justify-center border border-white/10 ${active ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)]' : ''}`}
      >
        {active && (
          <motion.div 
            animate={{ 
              scale: 1 + volume * 2,
              opacity: [0.4, 1, 0.4] 
            }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-4 h-4 rounded-full bg-white"
          />
        )}
      </motion.div>
    </div>
  )
}
