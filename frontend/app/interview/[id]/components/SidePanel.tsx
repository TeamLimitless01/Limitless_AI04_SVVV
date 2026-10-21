"use client";

import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, MessageSquare, ListOrdered, BarChart3 } from "lucide-react";
import InterviewChatPane from "@/components/interview-chat-pane";

type Message = { role: "assistant" | "user"; content: string; id?: string };

interface SidePanelProps {
  messages: Message[];
  isSpeechLoading: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  timeLeft: number;
  totalTime: number;
  isCaptionsOn: boolean;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const tabs = [
  { id: "transcript", label: "Transcript", icon: MessageSquare },
  { id: "progress", label: "Progress", icon: ListOrdered },
];

const SidePanel = memo(function SidePanel({
  messages,
  isSpeechLoading,
  setMessages,
  timeLeft,
  totalTime,
  isCaptionsOn,
}: SidePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "progress">("transcript");

  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const progressPct = totalTime > 0 ? Math.max(0, Math.min(100, ((totalTime - timeLeft) / totalTime) * 100)) : 0;
  const questionCount = assistantMessages.length;

  return (
    <div className="relative flex h-full">
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-20 w-6 h-12 flex items-center justify-center bg-[#0d0d1a]/90 border border-white/[0.08] rounded-l-xl backdrop-blur-md text-white/30 hover:text-white/70 transition-colors"
        title={collapsed ? "Open panel" : "Collapse panel"}
      >
        {collapsed ? (
          <ChevronLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Panel Content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="flex flex-col h-full overflow-hidden rounded-2xl md:rounded-[1.5rem] bg-[#0a0a14]/95 border border-white/[0.07] backdrop-blur-2xl shadow-2xl"
          >
            {/* Tab Bar */}
            <div className="flex items-center gap-1 px-3 pt-3 pb-0 border-b border-white/[0.06]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl text-[11px] font-semibold uppercase tracking-widest transition-all ${
                    activeTab === tab.id
                      ? "text-white border-b-2 border-blue-500"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}

              {/* Timer on right */}
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 mb-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <span
                  className={`text-xs font-mono font-bold tabular-nums ${
                    timeLeft <= 60 ? "text-red-400 animate-pulse" : "text-emerald-400"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === "transcript" ? (
                  <motion.div
                    key="transcript"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <InterviewChatPane
                      messages={messages}
                      isSpeechLoading={isSpeechLoading}
                      setMessages={setMessages}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 space-y-4 overflow-y-auto h-full custom-scrollbar"
                  >
                    {/* Session Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                          Session Progress
                        </span>
                        <span className="text-[10px] font-mono text-white/40">
                          {Math.round(progressPct)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                        <div className="text-xl font-black text-white tabular-nums">{questionCount}</div>
                        <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                          Questions
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                        <div className={`text-xl font-black tabular-nums ${timeLeft <= 60 ? "text-red-400" : "text-emerald-400"}`}>
                          {formatTime(timeLeft)}
                        </div>
                        <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                          Remaining
                        </div>
                      </div>
                    </div>

                    {/* Question list */}
                    <div>
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">
                        Questions Asked
                      </span>
                      <div className="space-y-2">
                        {assistantMessages.length === 0 ? (
                          <p className="text-white/20 text-xs">Interview not started yet.</p>
                        ) : (
                          assistantMessages.map((m, i) => (
                            <div
                              key={m.id || i}
                              className="flex gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                            >
                              <span className="text-blue-500 font-mono font-bold text-xs w-5 flex-shrink-0">
                                {(i + 1).toString().padStart(2, "0")}
                              </span>
                              <p className="text-white/50 text-xs leading-relaxed line-clamp-2">
                                {m.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Latest caption (shown when captions enabled) */}
            <AnimatePresence>
              {isCaptionsOn && messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]"
                >
                  <span className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest block mb-1">
                    Live Caption
                  </span>
                  <p className="text-white/60 text-xs leading-relaxed line-clamp-2">
                    {messages[messages.length - 1]?.content || ""}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SidePanel.displayName = "SidePanel";
export default SidePanel;
