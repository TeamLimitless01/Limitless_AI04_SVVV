"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface InterviewHeaderProps {
  id: string;
  speechEnabled: boolean;
  setSpeechEnabled: (v: boolean) => void;
  status?: "connecting" | "active" | "idle";
  interviewTitle?: string;
}

const ConnectionDot = ({ status }: { status: "connecting" | "active" | "idle" }) => {
  if (status === "active") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live</span>
      </div>
    );
  }
  if (status === "connecting") {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Connecting</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-white/20" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Idle</span>
    </div>
  );
};

const InterviewHeader = memo(
  ({ id, speechEnabled, setSpeechEnabled, status = "idle", interviewTitle }: InterviewHeaderProps) => {
    return (
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center justify-between gap-3 px-3 md:px-5 py-2.5 rounded-xl md:rounded-2xl bg-[#0a0a14]/90 border border-white/[0.07] backdrop-blur-2xl shadow-lg z-50 relative"
      >
        {/* Left: Logo + Title + Status */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Logo mark */}
          <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white text-xs font-black">N</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm md:text-base tracking-tight truncate">
                {interviewTitle || "Interview Session"}
              </span>
            </div>
            <div className="text-[9px] text-white/25 font-mono uppercase tracking-widest truncate hidden sm:block">
              ID: {id.slice(0, 10)}…
            </div>
          </div>

          {/* Connection status badge */}
          <div className="flex-shrink-0 hidden xs:flex items-center px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <ConnectionDot status={status} />
          </div>
        </div>

        {/* Right: AI Voice toggle */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all group cursor-pointer">
            <Label
              htmlFor="speech-mode-header"
              className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors cursor-pointer hidden sm:block"
            >
              AI Voice
            </Label>
            <Switch
              id="speech-mode-header"
              checked={speechEnabled}
              onCheckedChange={setSpeechEnabled}
              className="scale-75 md:scale-90"
            />
          </div>
        </div>
      </motion.header>
    );
  }
);

InterviewHeader.displayName = "InterviewHeader";
export default InterviewHeader;
