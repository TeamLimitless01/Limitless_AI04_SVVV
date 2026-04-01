"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import VideoPreview from "@/components/video-preview";
import InterviewChatPane from "@/components/interview-chat-pane";
import InterviewControls from "@/components/interview-controls";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStrapi } from "@/lib/api/useStrapi";
import { useChat } from "./useChat";
import { useSarvamStreamingTTS } from "./useSarvamStreamingTTS";
import toast from "react-hot-toast";
import { strapi } from "@/lib/api/sdk";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import Orb from "@/components/Orb";
import LightRays from "@/components/LightRay";
import { motion } from "framer-motion";
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
  
  // Refs for callbacks to avoid re-renders
  const startAnalyticsRef = useRef<(() => void) | null>(null);
  const stopAnalyticsRef = useRef<(() => string) | null>(null);
  
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [delayedAiSpeaking, setDelayedAiSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [showStartModal, setShowStartModal] = useState(true);

  const router = useRouter();

  const {
    queueText,
    flush,
    stop,
    unlockPlayback,
    isPlaying,
    isLoading: isSpeechLoading,
    error: speechError,
  } = useSarvamStreamingTTS({ languageCode: "en-IN" });

  const { sendMessage, isLoading: isChatLoading } = useChat({
    messages,
    setMessages,
    setAiSpeaking,
    setIsInterviewCompleted,
    queueText,
    flush,
    stop,
    speechEnabled,
  });


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

  const resumeUrl = useMemo(() => interviewData?.[0]?.resume || "", [interviewData]);

  const handleSend = useCallback(async (c: string) => {
    await sendMessage({ content: c, interviewDetails });
    setText("");
  }, [sendMessage, interviewDetails, setText]);

  const initialGreetings = useCallback(async () => {
    try {
      // const content = [
      //   ...(resumeUrl
      //     ? [{ type: "image_url", image_url: { url: resumeUrl } }]
      //     : []),
      //   {
      //     type: "text",
      //     text: interviewDetails.username
      //       ? "Hello I am " + interviewDetails.username
      //       : "",
      //   },
      // ];
const content = `Hello I am ${interviewDetails.username} and I am here to interview you for the position of ${interviewDetails.topic}`
      await sendMessage({ content, interviewDetails });
    } catch (error) {
      console.log("Initial greeting failed", error);
    }
  }, [resumeUrl, interviewDetails, sendMessage]);

  const startInterview = useCallback(() => {
    unlockPlayback();
    initialGreetings();
    setShowStartModal(false);

    if (startAnalyticsRef.current) startAnalyticsRef.current();
  }, [unlockPlayback, initialGreetings]);

  const isActuallySpeaking = isSpeechLoading || isPlaying || aiSpeaking;

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
      stop();
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
  }, [timeLeft, showStartModal, hasAutoSubmitted, isGeneratingReport, stop]);

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
          messages,
          interviewDetails,
          faceMeshFeedback: feed,
          tabSwitchCount: tabSwitchCount, // Passing the violations count
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
                  isSpeechLoading={isSpeechLoading || aiSpeaking}
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
