"use client";

import React, { createContext, memo, useContext, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  PanelRightClose,
  PanelRightOpen,
  PhoneOff,
  MessageSquare,
  Video,
  VideoOff,
} from "lucide-react";
import MicVisualizer from "@/components/mic-visualizer";
import { Loader2 } from "lucide-react";

interface BottomToolbarProps {
  listening: boolean;
  volume: number;
  isCameraOn: boolean;
  isTranscriptVisible: boolean;
  isSidePanelCollapsed: boolean;
  isInterviewCompleted: boolean;
  isGeneratingReport: boolean;
  micDisabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleTranscript: () => void;
  onToggleSidePanel: () => void;
  onEndInterview: () => void;
  onGenerateReport: () => void;
}

const MicrophoneContext = createContext<{
  listening: boolean;
  volume: number;
  disabled: boolean;
  onToggleMic: () => void;
} | null>(null);

const MicrophoneControl = memo(function MicrophoneControl() {
  const microphone = useContext(MicrophoneContext);
  if (!microphone)
    throw new Error("MicrophoneControl must be rendered inside BottomToolbar");

  const { listening, volume, disabled, onToggleMic } = microphone;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <button
          type="button"
          onClick={onToggleMic}
          disabled={disabled}
          title={disabled ? "Microphone disabled during interview closing" : listening ? "Mute Microphone" : "Unmute Microphone"}
          aria-pressed={listening}
          className={`relative w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center transition-all duration-200 border active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${
            listening
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15"
          }`}
        >
          {listening ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>
        {listening && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
            <MicVisualizer active={listening} volume={volume} />
          </div>
        )}
      </div>
      <span className="text-[9px] font-semibold text-white/25 uppercase tracking-widest hidden sm:block">
        {listening ? "Mic On" : "Muted"}
      </span>
    </div>
  );
});

type BottomToolbarContentProps = Omit<
  BottomToolbarProps,
  "listening" | "volume" | "micDisabled" | "onToggleMic"
>;

const BottomToolbarContent = memo(function BottomToolbarContent({
  isCameraOn,
  isTranscriptVisible,
  isSidePanelCollapsed,
  isInterviewCompleted,
  isGeneratingReport,
  onToggleCamera,
  onToggleTranscript,
  onToggleSidePanel,
  onEndInterview,
  onGenerateReport,
}: BottomToolbarContentProps) {
  const ToolBtn = ({
    onClick,
    active,
    activeClass = "bg-white/10 text-white",
    inactiveClass = "bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/8",
    label,
    className = "",
    showMobileLabel = false,
    children,
  }: {
    onClick: () => void;
    active: boolean;
    activeClass?: string;
    inactiveClass?: string;
    label: string;
    className?: string;
    showMobileLabel?: boolean;
    children: React.ReactNode;
  }) => (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        aria-pressed={active}
        className={`relative w-12 h-12 md:w-13 md:h-13 rounded-2xl flex items-center justify-center transition-all duration-200 border border-white/[0.08] active:scale-90 ${
          active ? activeClass : inactiveClass
        }`}
      >
        {children}
      </button>
      <span className={`text-[9px] font-semibold uppercase tracking-widest ${
        showMobileLabel ? "text-blue-300/70" : "hidden text-white/25 sm:block"
      }`}>
        {label}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
      className="flex items-center justify-between gap-2 md:gap-4 px-3 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-[1.5rem] bg-[#0d0d1a]/90 border border-white/[0.08] backdrop-blur-2xl shadow-2xl"
    >
      {/* Left group: Mic + Camera */}
      <div className="flex items-center gap-2 md:gap-3">
        <MicrophoneControl />

        {/* Camera button */}
        <ToolBtn
          onClick={onToggleCamera}
          active={isCameraOn}
          activeClass="bg-white/8 border-white/10 text-white/70 hover:bg-white/12"
          inactiveClass="bg-white/5 border-white/[0.06] text-white/30 hover:text-white/50"
          label={isCameraOn ? "Cam On" : "Cam Off"}
        >
          {isCameraOn ? (
            <Video className="w-4 h-4" />
          ) : (
            <VideoOff className="w-4 h-4" />
          )}
        </ToolBtn>
      </div>

      {/* Center: End Interview / Generate Report */}
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[200px] mx-auto">
        <AnimatePresence mode="wait">
          {isInterviewCompleted ? (
            <motion.button
              key="report-btn"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
              className="w-full px-4 md:px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Generate Report</span>
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              key="end-btn"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={onEndInterview}
              className="group relative flex items-center gap-2 md:gap-3 px-5 md:px-8 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-red-500/30 active:scale-95 transition-all"
            >
              <PhoneOff className="w-4 h-4 md:w-5 md:h-5 rotate-[135deg]" />
              <span className="hidden xs:inline">End Interview</span>
            </motion.button>
          )}
        </AnimatePresence>
        <span className="text-[9px] font-semibold text-white/20 uppercase tracking-widest hidden sm:block">
          {isInterviewCompleted ? "View Report" : "End Session"}
        </span>
      </div>

      {/* Right group: Captions + Sidebar */}
      <div className="flex items-center gap-2 md:gap-3">
        <ToolBtn
          onClick={onToggleTranscript}
          active={isTranscriptVisible}
          activeClass="bg-blue-500/15 border-blue-500/25 text-blue-400 hover:bg-blue-500/22"
          label={isTranscriptVisible ? "Show Orb" : "Transcript"}
          showMobileLabel
        >
          <MessageSquare className="w-4 h-4" />
        </ToolBtn>

        <ToolBtn
          onClick={onToggleSidePanel}
          active={!isSidePanelCollapsed}
          activeClass="bg-blue-500/15 border-blue-500/25 text-blue-400 hover:bg-blue-500/22"
          label={isSidePanelCollapsed ? "Open Sidebar" : "Hide Sidebar"}
          className="hidden lg:flex"
        >
          {isSidePanelCollapsed ? (
            <PanelRightOpen className="w-4 h-4" />
          ) : (
            <PanelRightClose className="w-4 h-4" />
          )}
        </ToolBtn>
      </div>
    </motion.div>
  );
});

const BottomToolbar = memo(function BottomToolbar({
  listening,
  volume,
  micDisabled,
  onToggleMic,
  ...toolbarProps
}: BottomToolbarProps) {
  const microphoneState = useMemo(
    () => ({ listening, volume, disabled: micDisabled, onToggleMic }),
    [listening, volume, micDisabled, onToggleMic],
  );

  return (
    <MicrophoneContext.Provider value={microphoneState}>
      <BottomToolbarContent {...toolbarProps} />
    </MicrophoneContext.Provider>
  );
});

BottomToolbar.displayName = "BottomToolbar";
export default BottomToolbar;
