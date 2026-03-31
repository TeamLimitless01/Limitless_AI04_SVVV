"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Loader2, Mic, Settings, X, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Orb from "@/components/Orb";
import LightRays from "@/components/LightRay";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "assistant" | "user"; content: string };

export default function InterviewPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInterviewCompleted, setIsInterviewCompleted] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [startAnalyticts, setStartAnalyticts] = useState<any>(null);
  const [stopAnalyticts, setStopAnalyticts] = useState<any>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [delayedAiSpeaking, setDelayedAiSpeaking] = useState(false);

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
    numOfQuestions: interviewData?.[0]?.numberOfQuestions,
    skills: interviewData?.[0]?.skills || "",
    username: interviewData?.[0]?.candidateName || "",
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

    if (startAnalyticts) startAnalyticts();
  }, [unlockPlayback, initialGreetings, startAnalyticts]);

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
      {/* Dynamic Background */}
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

      <AnimatePresence>
        {showStartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-3xl bg-black/60 p-6 text-center"
          >
            <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
              <div className="mb-6 w-20 h-20 mx-auto">
                <Orb hue={260} hoverIntensity={1} forceHoverState />
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                Ready for your interview?
              </h1>
              <p className="text-white/60 mb-8">
                Make sure your camera and microphone are working properly before we begin.
              </p>
              <Button
                onClick={startInterview}
                className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
              >
                Launch Interview
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col h-screen max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mic className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Interview Session</h1>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Session ID: {params.id.slice(0, 8)}...</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
              <Label htmlFor="speech-mode" className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors cursor-pointer">
                AI Voice
              </Label>
              <Switch
                id="speech-mode"
                checked={speechEnabled}
                onCheckedChange={setSpeechEnabled}
              />
            </div>
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" onClick={() => router.push('/dashboard')}>
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </header>

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
                startFn={setStartAnalyticts}
                stopFn={setStopAnalyticts}
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
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
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
                    onClick={async () => {
                      setIsGeneratingReport(true);
                      try {
                        let feed = "";
                        if (stopAnalyticts) {
                          feed = stopAnalyticts();
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
                        router.push("/reports");
                      } catch (err) {
                        console.error(err);
                        toast.error("Could not generate report");
                      } finally {
                        setIsGeneratingReport(false);
                      }
                    }}
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
