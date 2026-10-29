"use client";

import React, { memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Orb from "@/components/Orb";

type Message = { role: "assistant" | "user"; content: string; id?: string };

interface AIInterviewerStageProps {
  isActive: boolean;
  isConnecting: boolean;
  aiSpeaking: boolean;
  listening: boolean;
  volume: number;
  messages: Message[];
  showTranscript: boolean;
}

const AIInterviewerStage = memo(function AIInterviewerStage({
  isActive,
  isConnecting,
  aiSpeaking,
  listening,
  volume,
  messages,
  showTranscript,
}: AIInterviewerStageProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTranscript) {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, showTranscript]);

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

      {showTranscript ? (
        <section
          aria-label="Interview transcript"
          aria-live="polite"
          className="relative z-10 flex h-full w-full min-h-0 flex-col px-3 py-3 sm:px-6 sm:py-5"
        >
          <div className="mb-3 flex shrink-0 items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white sm:text-base">Live transcript</h2>
              <p className="mt-1 text-[11px] text-white/40">
                Interview conversation as it happens
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">
              {messages.length} {messages.length === 1 ? "message" : "messages"}
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-white/40">
                Your interview transcript will appear here.
              </div>
            ) : (
              messages.map((message, index) => (
                <article
                  key={message.id || `${message.role}-${index}`}
                  className={`max-w-[92%] rounded-2xl border px-3 py-2.5 sm:max-w-[80%] sm:px-4 sm:py-3 ${
                    message.role === "user"
                      ? "ml-auto border-blue-400/20 bg-blue-500/10"
                      : "mr-auto border-white/[0.08] bg-white/[0.04]"
                  }`}
                >
                  <p
                    className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${
                      message.role === "user" ? "text-blue-300" : "text-emerald-300"
                    }`}
                  >
                    {message.role === "user" ? "You" : "NeuraView AI"}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/80">
                    {message.content}
                  </p>
                </article>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </section>
      ) : (
        <>
          <AnimatePresence>
            {isActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: 1 + (aiSpeaking ? volume * 3 : 0),
                    opacity: aiSpeaking && volume > 0.01 ? 0.25 : 0.06,
                  }}
                  transition={{ duration: 0.08 }}
                  className="absolute aspect-square w-[38%] rounded-full border"
                  style={{ borderColor: aiSpeaking ? "rgba(59,130,246,0.5)" : "rgba(16,185,129,0.3)" }}
                />
                <motion.div
                  animate={{
                    scale: 1 + (aiSpeaking ? volume * 5 : 0),
                    opacity: aiSpeaking && volume > 0.01 ? 0.15 : 0.04,
                  }}
                  transition={{ duration: 0.12 }}
                  className="absolute aspect-square w-[50%] rounded-full border"
                  style={{ borderColor: aiSpeaking ? "rgba(139,92,246,0.4)" : "rgba(16,185,129,0.2)" }}
                />
              </div>
            )}
          </AnimatePresence>

          <div className="relative z-10 flex w-full flex-col items-center gap-4 px-4 sm:gap-6">
            <motion.div
              animate={{ scale: aiSpeaking ? 1 + volume * 0.3 : 1 }}
              transition={{ duration: 0.1 }}
              className="relative"
              style={{ width: "min(280px, 48vw)", height: "min(280px, 48vw)" }}
            >
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

            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-base font-semibold tracking-wide text-white md:text-lg">
                NeuraView AI
              </span>
              <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-md">
                <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                <span className={`text-[11px] font-semibold uppercase tracking-widest ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
            </div>

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
                      className="h-1.5 w-1.5 rounded-full bg-amber-400/60"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 opacity-30 sm:bottom-4 sm:left-4">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600">
              <span className="text-[8px] font-black text-white">N</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-white">NEURAVIEW AI</span>
          </div>
        </>
      )}
    </div>
  );
});

AIInterviewerStage.displayName = "AIInterviewerStage";
export default AIInterviewerStage;
