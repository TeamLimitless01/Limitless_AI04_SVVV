"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import VideoPreview from "@/components/video-preview";
import { useStrapi } from "@/lib/api/useStrapi";
import { useGeminiLive } from "./useGeminiLive";
import toast from "react-hot-toast";
import { strapi } from "@/lib/api/sdk";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Orb from "@/components/Orb";
import LightRays from "@/components/LightRay";
import { motion, AnimatePresence } from "framer-motion";
import StartInterviewModal from "./components/StartInterviewModal";
import InterviewHeader from "./components/InterviewHeader";
import AIInterviewerStage from "./components/AIInterviewerStage";
import BottomToolbar from "./components/BottomToolbar";
import SidePanel from "./components/SidePanel";

type Message = { role: "assistant" | "user"; content: string; id?: string };

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function InterviewPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [volume, setVolume] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // New UI state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);

  // Refs for callbacks
  const handleGenerateReportRef = useRef<(() => Promise<void>) | null>(null);
  const requestGenerateReport = useCallback(() => {
    const generateReport = handleGenerateReportRef.current;
    if (!generateReport) throw new Error("Report generation is not initialized.");
    void generateReport();
  }, []);

  const router = useRouter();

  const { data, isLoading } = useStrapi("interviews", {
    populate: "*",
    filters: { documentId: params.id },
  });

  const interviewData: any = useMemo(() => data?.data, [data]);

  const interviewDetails = useMemo(
    () => ({
      topic: interviewData?.[0]?.details || "",
      difficulty: interviewData?.[0]?.difficulty || "medium",
      mode: interviewData?.[0]?.mode || "text",
      interviewTime: interviewData?.[0]?.interviewTime || 15,
      skills: interviewData?.[0]?.skills || "",
      username: interviewData?.[0]?.candidateName || "",
      resume: interviewData?.[0]?.resume || "",
      interviewLanguage: interviewData?.[0]?.interviewLanguage || "english",
    }),
    [interviewData]
  );

  const totalTime = useMemo(
    () => (interviewData?.[0]?.interviewTime || 15) * 60,
    [interviewData]
  );

  const userTranscriptMsgId = useRef<string | null>(null);

  const onMessage = useCallback((newText: string) => {
    userTranscriptMsgId.current = null;
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

  const onUserTranscription = useCallback(
    (transcription: any) => {
      console.log("[InterviewPage] User Transcription Recv:", transcription);
      if (transcription.text) {
        setMessages((prev: any) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === "user" && lastMessage.id === userTranscriptMsgId.current) {
            const newMsg = { ...lastMessage, content: transcription.text };
            return [...prev.slice(0, -1), newMsg];
          } else {
            const newId = crypto.randomUUID();
            userTranscriptMsgId.current = newId;
            const newMsg = { role: "user", content: transcription.text, id: newId };
            return [...prev, newMsg];
          }
        });
      }
    },
    []
  );

  const {
    isActive,
    isConnecting,
    error: liveError,
    startSession,
    sendSystemMessage,
    stopSession,
  } = useGeminiLive({
    interviewDetails,
    onMessage,
    onInterrupt,
    onUserTranscription,
    setVolume,
    setAiSpeaking,
    setIsInterviewCompleted,
    isMuted: !listening,
  });

  useEffect(() => {
    const stopLiveInterview = () => {
      setListening(false);
      stopSession();
    };

    window.addEventListener("popstate", stopLiveInterview);
    window.addEventListener("pagehide", stopLiveInterview);
    return () => {
      window.removeEventListener("popstate", stopLiveInterview);
      window.removeEventListener("pagehide", stopLiveInterview);
      stopSession();
    };
  }, [stopSession]);

  useEffect(() => {
    if (!isActive && !isConnecting) setListening(false);
  }, [isActive, isConnecting]);

  useEffect(() => {
    if (aiSpeaking) userTranscriptMsgId.current = null;
  }, [aiSpeaking]);

  useEffect(() => {
    if (interviewData && interviewData[0]?.interviewTime) {
      setTimeLeft(interviewData[0].interviewTime * 60);
    } else {
      setTimeLeft(2 * 60);
    }
  }, [interviewData]);

  useEffect(() => {
    if (showStartModal || isInterviewCompleted || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [showStartModal, isInterviewCompleted, timeLeft]);

  const startInterview = useCallback(async (audioStream: MediaStream) => {
    try {
      await startSession(audioStream);
      setListening(true);
      setShowStartModal(false);
    } catch (error) {
      audioStream?.getTracks().forEach((track) => track.stop());
      throw error;
    }
  }, [startSession]);

  const reconnectAudioInterview = useCallback(async () => {
    let audioStream: MediaStream | undefined;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await startSession(audioStream);
      audioStream = undefined;
      setListening(true);
    } catch (error) {
      audioStream?.getTracks().forEach((track) => track.stop());
      toast.error(error instanceof Error ? error.message : "Could not reconnect to the interview.");
    }
  }, [startSession]);

  // Tab-switch detection
  useEffect(() => {
    if (showStartModal || isInterviewCompleted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isInterviewCompleted) {
        setTabSwitchCount((prev) => prev + 1);
        toast.error("Cheat detected! Tab switching is forbidden. Interview terminated.", {
          duration: 5000,
          icon: "🚫",
        });
        setListening(false);
        stopSession();
        requestGenerateReport();
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!document.hasFocus() && !isInterviewCompleted && document.visibilityState === "visible") {
          setTabSwitchCount((prev) => prev + 1);
          toast("Warning: Window focus lost. Please stay focused.", {
            icon: "⚠️",
            style: { border: "1px solid #ca8a04", padding: "10px", color: "#ca8a04", background: "#fefce8" },
          });
        }
      }, 1000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStartModal, isInterviewCompleted]);

  useEffect(() => {
    if (timeLeft === 10) {
      sendSystemMessage(
        "[SYSTEM: 10 seconds remaining. Close the interview now. Thank the candidate by name and say thanks you for using neuraview and end warmly .]"
      );
    }

    if (timeLeft === 0 && !showStartModal && !hasAutoSubmitted && !isGeneratingReport) {
      setHasAutoSubmitted(true);
      setListening(false);
      stopSession();
      setMessages((prev: Message[]) => [
        ...prev,
        { role: "assistant", content: "The interview time is up. Wrap up and report generation initiated." },
      ]);
      toast("Time is up! Wrapping up...", { icon: "⏳" });
      requestGenerateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, showStartModal, hasAutoSubmitted, isGeneratingReport, stopSession]);

  const handleGenerateReport = useCallback(async () => {
    if (isGeneratingReport) return;
    setListening(false);
    stopSession();
    setIsGeneratingReport(true);
    setIsInterviewCompleted(true);
    try {
      await strapi.update("interviews", params.id, { conversation: messages });
      const res = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          interviewDetails: {
            ...interviewDetails,
            numOfQuestions: messages.filter((m) => m.role === "assistant").length,
          },
          tabSwitchCount: tabSwitchCount,
        }),
      });
      const report = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof report?.error === "string" ? report.error : "Failed to generate report."
        );
      }
      if (report) await strapi.update("interviews", params.id, { report: JSON.stringify(report) });
      toast.success("Report generated!");
      router.push(`/reports?interviewId=${params.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not generate report.");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [isGeneratingReport, messages, interviewDetails, tabSwitchCount, params.id, router, stopSession]);

  handleGenerateReportRef.current = handleGenerateReport;

  const handleEndInterview = useCallback(() => {
    setListening(false);
    stopSession();
    requestGenerateReport();
  }, [stopSession, requestGenerateReport]);

  const toggleMic = useCallback(() => setListening((current) => !current), []);
  const toggleCamera = useCallback(() => setIsCameraOn((current) => !current), []);
  const toggleCaptions = useCallback(() => setIsCaptionsOn((current) => !current), []);
  const toggleSidePanel = useCallback(
    () => setIsSidePanelCollapsed((collapsed) => !collapsed),
    []
  );

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 gap-6">
        <div style={{ width: 120, height: 120 }}>
          <Orb hue={200} hoverIntensity={0.5} forceHoverState />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-white/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium tracking-wide">Initializing AI Interviewer...</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-blue-400"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main Layout ────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen h-screen bg-[#050508] text-white overflow-hidden font-sans flex flex-col">
      {/* Background ambient — only when modal showing */}
      {showStartModal && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <LightRays raysColor="#4a90e2" raysSpeed={0.5} lightSpread={0.8} rayLength={1.5} className="opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/50 to-[#050508]" />
        </div>
      )}

      {/* Start Modal */}
      <StartInterviewModal show={showStartModal} onStart={startInterview} />

      {/* ── PAGE CONTENT ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full max-w-[1800px] mx-auto w-full p-2 sm:p-3 md:p-4 gap-2 md:gap-3">

        {/* ── TOP BAR ──────────────────────────────────────────────────── */}
        <InterviewHeader
          id={params.id}
          status={isActive ? "active" : isConnecting ? "connecting" : "idle"}
          interviewTitle={interviewDetails.topic ? `${interviewDetails.topic} Interview` : "Interview Session"}
        />

        {/* ── MAIN AREA ─────────────────────────────────────────────────
            Desktop: [AI Stage (flexible)] [Side Panel (320px)]
            Mobile:  stacked (AI Stage → Controls → Side Panel collapsed)
        ─────────────────────────────────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col lg:flex-row ${
            isSidePanelCollapsed ? "gap-0" : "gap-2 md:gap-3"
          } min-h-0`}
        >

          {/* ── LEFT: AI Stage + PiP Camera ─────────────────────────── */}
          <div
            className={`flex flex-col gap-2 md:gap-3 min-h-0 min-w-0 ${
              isSidePanelCollapsed ? "flex-1 max-w-[1200px] mx-auto" : "flex-1"
            }`}
          >

            {/* AI Interviewer stage — takes up all available space */}
            <div className="flex-1 relative min-h-0">
              <AIInterviewerStage
                isActive={isActive}
                isConnecting={isConnecting}
                aiSpeaking={aiSpeaking}
                listening={listening}
                volume={volume}
              />

              {/* ── Picture-in-Picture Webcam ──────────────────────────
                  Desktop: bottom-right corner of AI stage
                  Mobile:  bottom-right of stage, smaller
              ─────────────────────────────────────────────────────── */}
              <div
                className={`
                  absolute bottom-3 right-3 z-20
                  w-[28vw] max-w-[160px] min-w-[100px]
                  sm:w-[22vw] sm:max-w-[180px]
                  md:w-[18vw] md:max-w-[200px]
                  lg:w-[14vw] lg:max-w-[220px]
                  transition-all duration-300
                  ${!isCameraOn || !isActive ? "opacity-0 pointer-events-none" : "opacity-100"}
                `}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black"
                  style={{ aspectRatio: "4/3" }}
                >
                  {isCameraOn && isActive && <VideoPreview pipMode />}

                  {/* PiP overlays */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Live border */}
                    {isActive && (
                      <div className="absolute inset-0 border border-emerald-500/30 rounded-xl md:rounded-2xl animate-pulse" />
                    )}
                    {/* Name tag */}
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                      <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                        You
                      </span>
                    </div>
                    {/* Mic indicator */}
                    {listening && (
                      <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Captions overlay on AI stage */}
              <AnimatePresence>
                {isCaptionsOn && messages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-3 left-3 right-[calc(28vw+1.5rem)] sm:right-[calc(22vw+1.5rem)] md:right-[calc(18vw+1.5rem)] lg:right-[calc(14vw+1.5rem)] z-10 pointer-events-none"
                  >
                    <div className="px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 max-w-[80%] mx-auto text-center">
                      <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
                        {messages[messages.length - 1]?.content}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Connection error ──────────────────────────────────── */}
            {liveError && !showStartModal && !isInterviewCompleted && (
              <div className="px-2">
                <div role="alert" className="mb-2 flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                  <span>Interview connection failed: {liveError}</span>
                  <button
                    type="button"
                    onClick={reconnectAudioInterview}
                    disabled={isConnecting}
                    className="shrink-0 rounded-lg border border-red-300/20 px-3 py-1.5 font-semibold hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {isConnecting ? "Reconnecting..." : "Reconnect"}
                  </button>
                </div>
              </div>
            )}

            {/* ── BOTTOM TOOLBAR ─────────────────────────────────────── */}
            <BottomToolbar
              listening={listening}
              volume={volume}
              isCameraOn={isCameraOn}
              isCaptionsOn={isCaptionsOn}
              isSidePanelCollapsed={isSidePanelCollapsed}
              isInterviewCompleted={isInterviewCompleted}
              isGeneratingReport={isGeneratingReport}
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              onToggleCaptions={toggleCaptions}
              onToggleSidePanel={toggleSidePanel}
              onEndInterview={handleEndInterview}
              onGenerateReport={requestGenerateReport}
            />
          </div>

          {/* ── RIGHT: Collapsible Side Panel (Desktop only) ─────────── */}
          <div
            className={`hidden lg:flex flex-col min-h-0 min-w-0 flex-shrink-0 transition-[width] duration-300 ${
              isSidePanelCollapsed ? "w-0" : "w-[320px] xl:w-[360px]"
            }`}
          >
            <SidePanel
              messages={messages}
              isSpeechLoading={isConnecting || aiSpeaking}
              setMessages={setMessages}
              timeLeft={timeLeft}
              totalTime={totalTime}
              isCaptionsOn={isCaptionsOn}
              collapsed={isSidePanelCollapsed}
              onCollapsedChange={setIsSidePanelCollapsed}
            />
          </div>
        </div>

        {/* ── Mobile Transcript Drawer ────────────────────────────────── */}
        {/* On mobile (< lg) show a minimal horizontal scrollable message strip */}
        <div className="lg:hidden flex-shrink-0">
          <AnimatePresence>
            {isCaptionsOn && messages.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-2 py-2 rounded-xl bg-[#0a0a14]/90 border border-white/[0.06] backdrop-blur-xl">
                  <span className="text-[9px] font-bold text-blue-400/50 uppercase tracking-widest block mb-1">
                    Latest
                  </span>
                  <p className="text-white/60 text-xs leading-relaxed line-clamp-2">
                    {messages[messages.length - 1]?.content || ""}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </main>
  );
}
