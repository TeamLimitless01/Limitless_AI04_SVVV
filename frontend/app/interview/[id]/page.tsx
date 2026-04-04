"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import VideoPreview from "@/components/video-preview";
import InterviewChatPane from "@/components/interview-chat-pane";
import InterviewControls from "@/components/interview-controls";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStrapi } from "@/lib/api/useStrapi";
import { useGeminiLive } from "./useGeminiLive";
import toast from "react-hot-toast";
import { strapi } from "@/lib/api/sdk";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight, Mic, MicOff } from "lucide-react";
import Orb from "@/components/Orb";
import LightRays from "@/components/LightRay";
import { motion, AnimatePresence } from "framer-motion";
import StartInterviewModal from "./components/StartInterviewModal";
import InterviewHeader from "./components/InterviewHeader";

type Message = { role: "assistant" | "user"; content: string };

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function InterviewPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [volume, setVolume] = useState(0);
  
  // Refs for callbacks to avoid re-renders
  const startAnalyticsRef = useRef<(() => void) | null>(null);
  const stopAnalyticsRef = useRef<(() => string) | null>(null);
  
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [delayedAiSpeaking, setDelayedAiSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);

  const router = useRouter();

  const { data, isLoading } = useStrapi("interviews", {
    populate: "*",
    filters: { documentId: params.id },
  });

  const interviewData: any = useMemo(() => data?.data, [data]);

  const interviewDetails = useMemo(() => ({
    topic: interviewData?.[0]?.details || "",
    difficulty: interviewData?.[0]?.difficulty || "medium",
    mode: interviewData?.[0]?.mode || "text",
    interviewTime: interviewData?.[0]?.interviewTime || 15,
    skills: interviewData?.[0]?.skills || "",
    username: interviewData?.[0]?.candidateName || "",
    resume: interviewData?.[0]?.resume || "",
    interviewLanguage: interviewData?.[0]?.interviewLanguage || "english",
  }), [interviewData]);

  const onMessage = useCallback((newText: string) => {
    userTranscriptMsgId.current = null; // Reset user transcript ID as AI has started speaking
    setMessages((prev: any) => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage?.role === "assistant") {
        return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + newText }];
      } else {
        return [...prev, { role: "assistant", content: newText, id: crypto.randomUUID() }];
      }
    });
  }, []);

  const onInterrupt = useCallback(() => {
    console.log("[InterviewPage] AI Interrupted by User");
  }, []);

  const userTranscriptMsgId = useRef<string | null>(null);

  const onUserTranscription = useCallback((transcription: any) => {
    console.log("[InterviewPage] User Transcription Recv:", transcription);
    if (mode === "voice" && transcription.text) {
      setText(transcription.text);

      setMessages((prev: any) => {
        // If we don't have an ID yet, or the last message is NOT a user message from this transcription
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "user" && lastMessage.id === userTranscriptMsgId.current) {
          // Update the existing message
          const newMsg = { ...lastMessage, content: transcription.text };
          return [...prev.slice(0, -1), newMsg];
        } else {
          // New message
          const newId = crypto.randomUUID();
          userTranscriptMsgId.current = newId;
          const newMsg = {
            role: "user",
            content: transcription.text,
            id: newId
          };
          return [...prev, newMsg];
        }
      });
    }
  }, [mode]);

  const {
    isActive,
    isConnecting,
    error: liveError,
    startSession,
    stopSession,
    session
  } = useGeminiLive({
    interviewDetails,
    onMessage,
    onInterrupt,
    onUserTranscription,
    setVolume,
    setAiSpeaking,
    setIsInterviewCompleted,
    isMuted: !listening
  });

  const isActuallySpeaking = aiSpeaking;

  useEffect(() => {
    if (isActive) {
      setListening(true);
    }
  }, [isActive]);

  useEffect(() => {
    if (aiSpeaking) {
      userTranscriptMsgId.current = null;
    }
  }, [aiSpeaking]);

  useEffect(() => {
    if (isActuallySpeaking) {
      setDelayedAiSpeaking(true);
    } else {
      const timer = setTimeout(() => {
        setDelayedAiSpeaking(false);
      }, 500); // 0.5s delay
      return () => clearTimeout(timer);
    }
  }, [isActuallySpeaking]);

  useEffect(() => {
    if (interviewData && interviewData[0]?.interviewTime) {
      setTimeLeft(interviewData[0].interviewTime * 60);
    } else {
      setTimeLeft(15 * 60);
    }
  }, [interviewData]);

  useEffect(() => {
    if (showStartModal || isInterviewCompleted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showStartModal, isInterviewCompleted, timeLeft]);

  const startInterview = useCallback(() => {
    console.log("[InterviewPage] Attempting to start interview...");
    setListening(true);
    startSession();
    setShowStartModal(false);

    if (startAnalyticsRef.current) startAnalyticsRef.current();
  }, [startSession, setListening]);

  const handleSend = useCallback(async (c: string) => {
    console.log("[InterviewPage] Sending Message:", c);
    if (session) {
      if (mode === "text") {
        session.send({ text: c });
      }
      // Always add to messages for visualization
      setMessages((prev: any) => [...prev, { role: "user", content: c, id: crypto.randomUUID() }]);
    }
    setText("");
  }, [session, mode]);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    if (showStartModal || isInterviewCompleted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isInterviewCompleted) {
        setTabSwitchCount((prev) => prev + 1);
        toast.error("Cheat detected! Tab switching is forbidden. Interview terminated.", {
          duration: 5000,
          icon: '🚫',
        });
        handleGenerateReport();
      }
    };

    const handleBlur = () => {
      // Small delay to check if it was just a transient blur or focus was stolen by a prompt
      setTimeout(() => {
        // If focus was lost but the page is STILL visible, it might be a browser prompt
        if (!document.hasFocus() && !isInterviewCompleted && document.visibilityState === "visible") {
          setTabSwitchCount((prev) => prev+1);
          toast("Warning: Window focus lost. Please stay focused.", {
            icon: '⚠️',
            style: { border: '1px solid #ca8a04', padding: '10px', color: '#ca8a04', background: '#fefce8' }
          });
        }
      }, 1000); // 1s grace period for prompts
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showStartModal, isInterviewCompleted]);

  useEffect(() => {
    if (timeLeft === 0 && !showStartModal && !hasAutoSubmitted && !isGeneratingReport) {
      setHasAutoSubmitted(true);
      stopSession();
      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "assistant",
          content: "The interview time is up. Wrap up and report generation initiated."
        }
      ]);
      toast("Time is up! Wrapping up...", { icon: '⏳' });
      handleGenerateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, showStartModal, hasAutoSubmitted, isGeneratingReport, stopSession]);

  const handleGenerateReport = async () => {
    if (isGeneratingReport) return;
    setIsGeneratingReport(true);
    setIsInterviewCompleted(true);
    try {
      let feed = "";
      if (stopAnalyticsRef.current) {
        feed = stopAnalyticsRef.current();
      }
      await strapi.update("interviews", params.id, {
        conversation: messages,
      });
      const res = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          interviewDetails: {
            ...interviewDetails,
            numOfQuestions: messages.filter(m => m.role === 'assistant').length // Calculate for legacy UI if needed
          },
          faceMeshFeedback: feed,
          tabSwitchCount: tabSwitchCount, 
        }),
      });
      if (!res.ok) throw new Error("Failed to generate report");

      const report = await res.json();
      if (report) {
        await strapi.update("interviews", params.id, {
          report: JSON.stringify(report),
        });
      }
      toast.success("Report generated!");
      router.push(`/reports?interviewId=${params.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not generate report");
    } finally {
      setIsGeneratingReport(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <Orb hue={200} hoverIntensity={0.5} forceHoverState />
        <div className="mt-8 text-xl font-medium animate-pulse">
          Initializing AI Interviewer...
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#050505] text-white overflow-hidden font-sans">
      {/* Dynamic Background - Hidden during active interview for performance */}
      {showStartModal && (
        <div className="absolute inset-0 z-0">
          <LightRays
            raysColor="#4a90e2"
            raysSpeed={0.5}
            lightSpread={0.8}
            rayLength={1.5}
            className="opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
        </div>
      )}

      <StartInterviewModal
        show={showStartModal}
        onStart={startInterview}
      />

      <div className="relative z-10 flex flex-col h-screen max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <InterviewHeader
          id={params.id}
          speechEnabled={speechEnabled}
          setSpeechEnabled={setSpeechEnabled}
          status={isActive ? "active" : isConnecting ? "connecting" : "idle"}
        />

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
          {/* Left Column: User Presence (40%) */}
          <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
            {/* User Camera Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative flex-1 flex flex-col min-h-0"
            >
              <VideoPreview
                startFn={(fn: any) => { startAnalyticsRef.current = fn(); }}
                stopFn={(fn: any) => { stopAnalyticsRef.current = fn(); }}
              />

              {/* Live Call Overlay */}
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 pointer-events-none rounded-[2.5rem] overflow-hidden"
                  >
                    {/* Pulsing Border */}
                    <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-[2.5rem] animate-pulse" />
                    
                    {/* Live Badge */}
                    <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Session</span>
                    </div>

                    {/* Duration / Status */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                      <div className="flex flex-col items-center">
                         <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Connection</span>
                         <span className="text-sm font-bold text-emerald-400">Excellent</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col items-center">
                         <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Interruption</span>
                         <span className="text-sm font-bold text-blue-400">Enabled</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Visualizer Rings around Camera */}
              <AnimatePresence>
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-10">
                    <motion.div
                      animate={{
                        scale: 1 + volume * 2.5,
                        opacity: volume > 0.01 ? 0.3 : 0.1,
                        borderColor: aiSpeaking ? "rgba(59, 130, 246, 0.5)" : "rgba(16, 185, 129, 0.5)"
                      }}
                      className="absolute w-64 h-64 rounded-full border-2"
                    />
                    <motion.div
                      animate={{
                        scale: 1 + volume * 4,
                        opacity: volume > 0.01 ? 0.2 : 0.05,
                        borderColor: aiSpeaking ? "rgba(168, 85, 247, 0.3)" : "rgba(20, 184, 166, 0.3)"
                      }}
                      className="absolute w-80 h-80 rounded-full border-2"
                    />
                  </div>
                )}
              </AnimatePresence>
            </motion.div>

          </div>

          {/* Right Column: Interaction Hub (60%) */}
          <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
            {/* Chat History */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-white/40 uppercase">Conversation Feed</span>
                <div className={`text-sm md:text-base font-mono font-bold px-4 py-1.5 rounded-xl border flex items-center shadow-lg backdrop-blur-md transition-colors ${timeLeft <= 60 ? "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"}`}>
                  ⏱ {formatTime(timeLeft)}
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <InterviewChatPane
                  messages={messages}
                  isSpeechLoading={isConnecting || aiSpeaking}
                  setMessages={setMessages}
                />
              </div>

              {/* Controls Footer */}
              <div className="p-6 bg-white/[0.02] border-t border-white/10">
                {!isInterviewCompleted ? (
                  <InterviewControls
                    aiSpeaking={delayedAiSpeaking}
                    mode={mode}
                    listening={listening}
                    text={text}
                    setMode={setMode}
                    interviewLanguage={interviewDetails.interviewLanguage || 'english'}
                    setListening={setListening}
                    setText={setText}
                    handleSend={handleSend}
                    liveActive={isActive}
                    volume={volume}
                    stopSession={stopSession}
                  />
                ) : (
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 group"
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        Analyzing Interview Data...
                      </>
                    ) : (
                      <>
                        Complete & Generate Report
                        <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
