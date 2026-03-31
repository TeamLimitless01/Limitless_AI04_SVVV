"use client"

import { motion } from "framer-motion"

export default function MicVisualizer({ active }: { active: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {/* Outer Glow Ring */}
      {active && (
        <>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="absolute w-full h-full rounded-full border-2 border-red-500/30"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
            className="absolute w-full h-full rounded-full border border-red-500/20"
          />
        </>
      )}

      {/* Main Core */}
      <motion.div
        animate={active ? { 
          scale: [1, 1.1, 1],
          backgroundColor: ["#ef4444", "#dc2626", "#ef4444"]
        } : { 
          scale: 1,
          backgroundColor: "rgba(255, 255, 255, 0.05)"
        }}
        transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
        className={`w-16 h-16 rounded-full flex items-center justify-center border border-white/10 ${active ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)]' : ''}`}
      >
        {active && (
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-4 h-4 rounded-full bg-white"
          />
        )}
      </motion.div>
    </div>
  )
}
