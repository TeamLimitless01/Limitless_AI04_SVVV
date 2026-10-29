"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import VideoPreview from "@/components/video-preview";
import { useStrapi } from "@/lib/api/useStrapi";
import { useGeminiLive } from "./useGeminiLive";
import toast from "react-hot-toast";
import { strapi } from "@/lib/api/sdk";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import LightRays from "@/components/LightRay";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StartInterviewModal from "./components/StartInterviewModal";
import InterviewHeader from "./components/InterviewHeader";
import AIInterviewerStage from "./components/AIInterviewerStage";
import BottomToolbar from "./components/BottomToolbar";
import SidePanel from "./components/SidePanel";

type Message = { role: "assistant" | "user"; content: string; id?: string };

function removeUnansweredAssistantTail(messages: Message[]) {
  let lastCandidateMessageIndex = messages.length - 1;
  while (
    lastCandidateMessageIndex >= 0 &&
    messages[lastCandidateMessageIndex].role !== "user"
  ) {
    lastCandidateMessageIndex--;
  }
  return lastCandidateMessageIndex < 0
    ? []
    : messages.slice(0, lastCandidateMessageIndex + 1);
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function InterviewPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [volume, setVolume] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // New UI state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);

  // Refs for callbacks
  const handleGenerateReportRef = useRef<(() => Promise<void>) | null>(null);
  const closingStartedRef = useRef(false);
  const timeExpiredRef = useRef(false);
  const requestGenerateReport = useCallback(() => {
    const generateReport = handleGenerateReportRef.current;
    if (!generateReport) throw new Error("Report generation is not initialized.");
    void generateReport();
  }, []);

  const router = useRouter();

  const { data, isLoading, mutate: revalidateInterview } = useStrapi(
    "interviews",
    {
      populate: "*",
      filters: { documentId: params.id },
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

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
    const previous = messagesRef.current;
    const lastMessage = previous[previous.length - 1];
    const next =
      lastMessage?.role === "assistant"
        ? [
            ...previous.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + newText },
          ]
        : [
            ...previous,
            { role: "assistant" as const, content: newText, id: crypto.randomUUID() },
          ];
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const onInterrupt = useCallback(() => {
    console.log("[InterviewPage] AI Interrupted by User");
  }, []);

  const onUserTranscription = useCallback(
    (transcription: any) => {
      console.log("[InterviewPage] User Transcription Recv:", transcription);
      if (transcription.text) {
        const previous = messagesRef.current;
        const lastMessage = previous[previous.length - 1];
        const next =
          lastMessage?.role === "user" &&
          lastMessage.id === userTranscriptMsgId.current
            ? [
                ...previous.slice(0, -1),
                { ...lastMessage, content: transcription.text },
              ]
            : [
                ...previous,
                {
                  role: "user" as const,
                  content: transcription.text,
                  id: crypto.randomUUID(),
                },
              ];
        if (next[next.length - 1].role === "user") {
          userTranscriptMsgId.current = next[next.length - 1].id ?? null;
        }
        messagesRef.current = next;
        setMessages(next);
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
    if (
      timeLeft > 0 &&
      timeLeft <= 10 &&
      !showStartModal &&
      !closingStartedRef.current
    ) {
      closingStartedRef.current = true;
      setIsClosing(true);
      setListening(false);
      sendSystemMessage(
        "[SYSTEM: The interview is ending now. The microphone is disabled. Do not ask another question, invite a response, or start a new topic. Give a brief, warm closing and thank the candidate for using NeuraView.]"
      );
    }

    if (timeLeft === 0 && !showStartModal && !hasAutoSubmitted && !isGeneratingReport) {
      timeExpiredRef.current = true;
      setIsClosing(true);
      setHasAutoSubmitted(true);
      setListening(false);
      stopSession();
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
    const currentMessages = messagesRef.current;
    const reportMessages = timeExpiredRef.current
      ? removeUnansweredAssistantTail(currentMessages)
      : currentMessages;
    messagesRef.current = reportMessages;
    setMessages(reportMessages);
    try {
      await strapi.update("interviews", params.id, { conversation: reportMessages });
      const res = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: reportMessages.map(({ role, content }) => ({ role, content })),
          interviewDetails: {
            ...interviewDetails,
            numOfQuestions: reportMessages.filter((m) => m.role === "assistant").length,
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
      if (report) {
        await strapi.update("interviews", params.id, { report: JSON.stringify(report) });
        try {
          await revalidateInterview();
        } catch (cacheError) {
          console.error("Report was saved, but interview cache revalidation failed.", cacheError);
          toast.error("Report generated, but interview details could not be refreshed.");
        }
      }
      toast.success("Report generated!");
      router.push(`/reports?interviewId=${params.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not generate report.");
    } finally {
      setIsGeneratingReport(false);
    }
  }, [isGeneratingReport, interviewDetails, tabSwitchCount, params.id, router, stopSession, revalidateInterview]);

  handleGenerateReportRef.current = handleGenerateReport;

  const handleEndInterview = useCallback(() => {
    setIsTerminateDialogOpen(true);
  }, []);

  const handleConfirmTermination = useCallback(() => {
    setIsTerminateDialogOpen(false);
    setIsClosing(true);
    setListening(false);
    stopSession();
    router.push("/reports");
  }, [router, stopSession]);

  const toggleMic = useCallback(() => {
    if (!isClosing) setListening((current) => !current);
  }, [isClosing]);
  const toggleCamera = useCallback(() => setIsCameraOn((current) => !current), []);
  const toggleTranscript = useCallback(
    () => setIsTranscriptVisible((current) => !current),
    [],
  );
  const toggleSidePanel = useCallback(
    () => setIsSidePanelCollapsed((collapsed) => !collapsed),
    []
  );

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 gap-6">
        <Image
          src="/neuraview-loader.png"
          alt="Neuraview"
          width={240}
          height={180}
          priority
          className="site-loader__logo"
        />
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

      <AlertDialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
      >
        <AlertDialogContent className="border-white/10 bg-slate-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate this interview?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to terminate? No report will be generated
              and this interview will not be scored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Continue interview
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTermination}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Yes, terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── PAGE CONTENT ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full max-w-[1800px] mx-auto w-full p-2 sm:p-3 md:p-4 gap-2 md:gap-3">

        {/* ── TOP BAR ──────────────────────────────────────────────────── */}
        <InterviewHeader
          id={params.id}
          status={isActive ? "active" : isConnecting ? "connecting" : "idle"}
          interviewTitle={interviewDetails.topic ? `${interviewDetails.topic} Interview` : "Interview Session"}
          timeLeft={timeLeft}
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
                messages={messages}
                showTranscript={isTranscriptVisible}
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
                  ${!isCameraOn || !isActive || isTranscriptVisible ? "opacity-0 pointer-events-none" : "opacity-100"}
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
              isTranscriptVisible={isTranscriptVisible}
              isSidePanelCollapsed={isSidePanelCollapsed}
              isInterviewCompleted={isInterviewCompleted}
              isGeneratingReport={isGeneratingReport}
              micDisabled={isClosing}
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              onToggleTranscript={toggleTranscript}
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
              collapsed={isSidePanelCollapsed}
              onCollapsedChange={setIsSidePanelCollapsed}
            />
          </div>
        </div>

      </div>
    </main>
  );
}
