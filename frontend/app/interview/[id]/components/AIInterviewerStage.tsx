"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Orb from "@/components/Orb";

interface AIInterviewerStageProps {
  isActive: boolean;
  isConnecting: boolean;
  aiSpeaking: boolean;
  listening: boolean;
  volume: number;
}

const AIInterviewerStage = memo(function AIInterviewerStage({
  isActive,
  isConnecting,
  aiSpeaking,
  listening,
  volume,
}: AIInterviewerStageProps) {
  const getAIStatus = () => {
    if (!isActive && !isConnecting) return "idle";
    if (isConnecting) return "connecting";
    if (aiSpeaking) return "speaking";
    if (listening) return "listening";
    return "processing";
  };

  const status = getAIStatus();

  const statusConfig = {
    idle: {
      label: "Waiting to Start",
      color: "text-white/40",
      dot: "bg-white/20",
      ring: "border-white/10",
      orbHue: 220,
    },
    connecting: {
      label: "Connecting...",
      color: "text-blue-400",
      dot: "bg-blue-500 animate-pulse",
      ring: "border-blue-500/30",
      orbHue: 240,
    },
    speaking: {
      label: "AI is Speaking",
      color: "text-blue-400",
      dot: "bg-blue-500",
      ring: "border-blue-500/50",
      orbHue: 200,
    },
    listening: {
      label: "Listening...",
      color: "text-emerald-400",
      dot: "bg-emerald-500",
      ring: "border-emerald-500/50",
      orbHue: 160,
    },
    processing: {
      label: "Processing",
      color: "text-amber-400",
      dot: "bg-amber-500 animate-pulse",
      ring: "border-amber-500/30",
      orbHue: 40,
    },
  };

  const cfg = statusConfig[status];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl md:rounded-[2rem] bg-[#07070f] border border-white/[0.06]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full blur-[80px] transition-all duration-700"
          style={{
            background:
              status === "speaking"
                ? "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)"
                : status === "listening"
                ? "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Pulsing volume rings when AI speaks */}
      <AnimatePresence>
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: 1 + (aiSpeaking ? volume * 3 : 0),
                opacity: aiSpeaking && volume > 0.01 ? 0.25 : 0.06,
              }}
              transition={{ duration: 0.08 }}
              className="absolute w-[38%] aspect-square rounded-full border"
              style={{ borderColor: aiSpeaking ? "rgba(59,130,246,0.5)" : "rgba(16,185,129,0.3)" }}
            />
            <motion.div
              animate={{
                scale: 1 + (aiSpeaking ? volume * 5 : 0),
                opacity: aiSpeaking && volume > 0.01 ? 0.15 : 0.04,
              }}
              transition={{ duration: 0.12 }}
              className="absolute w-[50%] aspect-square rounded-full border"
              style={{ borderColor: aiSpeaking ? "rgba(139,92,246,0.4)" : "rgba(16,185,129,0.2)" }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Central Orb */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full px-4">
        <motion.div
          animate={{
            scale: aiSpeaking ? 1 + volume * 0.3 : 1,
          }}
          transition={{ duration: 0.1 }}
          className="relative"
          style={{ width: "min(280px, 48vw)", height: "min(280px, 48vw)" }}
        >
          {/* Outer ring for speaking state */}
          <AnimatePresence>
            {status === "speaking" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-[-12px] rounded-full border-2 border-blue-500/20 animate-pulse"
              />
            )}
            {status === "listening" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-[-12px] rounded-full border-2 border-emerald-500/20 animate-pulse"
              />
            )}
          </AnimatePresence>

          <Orb
            hue={cfg.orbHue}
            hoverIntensity={isActive ? 0.8 : 0.3}
            forceHoverState={isActive}
          />
        </motion.div>

        {/* AI Name & Status */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-white font-semibold text-base md:text-lg tracking-wide">
            NeuraView AI
          </span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className={`text-[11px] font-semibold uppercase tracking-widest ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Processing dots */}
        <AnimatePresence>
          {status === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-1.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400/60"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Identity watermark bottom-left */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-30">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-[8px] font-black">N</span>
        </div>
        <span className="text-white text-[10px] font-semibold tracking-wider">NEURAVIEW AI</span>
      </div>
    </div>
  );
});

AIInterviewerStage.displayName = "AIInterviewerStage";
export default AIInterviewerStage;
