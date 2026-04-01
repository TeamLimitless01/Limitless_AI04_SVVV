"use client";

import React, { useEffect, useRef, useState } from "react";
import AISpeakingBars from "./ai-speaking-bars";
import MicVisualizer from "./mic-visualizer";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, StopCircle, Type, RotateCcw, AlertCircle, Loader2 } from "lucide-react";

interface InterviewControlsProps {
  aiSpeaking: boolean;
  mode: "voice" | "text";
  listening: boolean;
  text: string;
  interviewLanguage: string;
  setMode: (mode: "voice" | "text") => void;
  setListening: (listening: any) => void;
  setText: (text: string) => void;
  handleSend: (text: string) => void;
}

const InterviewControls = React.memo(function InterviewControls({
  aiSpeaking,
  mode,
  interviewLanguage,
  listening,
  text,
  setMode,
  setListening,
  setText,
  handleSend,
}: InterviewControlsProps) {
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SILENCE_THRESHOLD = 2000; // 2 seconds of silence to trigger send
  
  const listeningRef = useRef(listening);
  const aiSpeakingRef = useRef(aiSpeaking);
  const textRef = useRef(text);
  const handleSendRef = useRef(handleSend);
  const interviewLanguageRef = useRef(interviewLanguage);

  useEffect(() => {
    listeningRef.current = listening;
    aiSpeakingRef.current = aiSpeaking;
    textRef.current = text;
    handleSendRef.current = handleSend;
    interviewLanguageRef.current = interviewLanguage;
  }, [listening, aiSpeaking, text, handleSend, interviewLanguage]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Error starting MediaRecorder:", err);
    }
  };

  const handleFinalizeAndSend = async (fallbackSpeech: string) => {
    if (isTranscribing) return;
    
    setListening(false);
    setIsTranscribing(true);

    let finalSpeech = fallbackSpeech;

    // Try to get accurate transcription from Sarvam
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        const transcript = await new Promise<string | null>((resolve) => {
          if (!mediaRecorderRef.current) return resolve(null);

          mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

            if (audioBlob.size < 500) {
              console.log("Audio too short, using fallback");
              return resolve(null);
            }

            try {
              const formData = new FormData();
              formData.append("file", audioBlob);
              formData.append("language", interviewLanguageRef.current === 'english' ? 'en-IN' : 'hi-IN');

              const response = await fetch("/api/interview/stt", {
                method: "POST",
                body: formData,
              });

              if (!response.ok) throw new Error("STT fetch failed");
              const data = await response.json();
              resolve(data.transcript || null);
            } catch (err) {
              console.error("Sarvam STT failed, using fallback:", err);
              resolve(null);
            }
          };
          
          if (mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        });

        if (transcript) {
          finalSpeech = transcript;
        }
      } catch (err) {
        console.error("Recorder error:", err);
      }
    }

    if (finalSpeech.trim()) {
      handleSendRef.current(finalSpeech.trim());
      setText("");
    }
    setIsTranscribing(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = interviewLanguage == 'english' ? 'en-IN' : 'hi-IN';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript || interimTranscript) {
          const currentTranscript = (finalTranscript + interimTranscript).trim();
          setText(currentTranscript);

          // Clear existing timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          // Set new timeout for silence detection
          silenceTimeoutRef.current = setTimeout(() => {
            const currentSpeech = textRef.current.trim();
            if (currentSpeech && listeningRef.current && !aiSpeakingRef.current) {
              handleFinalizeAndSend(currentSpeech);
            }
          }, SILENCE_THRESHOLD);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setError("Microphone access denied.");
        } else if (event.error === 'network') {
          setError("Network error.");
        } else if (event.error !== 'aborted') {
          setError(`Error: ${event.error}`);
        }
        
        if (['not-allowed', 'service-not-allowed', 'language-not-supported'].includes(event.error)) {
          setListening(false);
        }
      };

      recognition.onend = () => {
        if (listeningRef.current && !aiSpeakingRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [setListening, setText]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      setError(null);
      startRecording();
      try {
        recognition.start();
      } catch (e) {}
    } else {
      try {
        // If we're not finalizing (which handles its own stop), stop here.
        if (!isTranscribing && mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.onstop = () => {
             mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          };
          mediaRecorderRef.current.stop();
        }
        recognition.stop();
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      } catch (e) {}
    }
  }, [listening]);

  useEffect(() => {
    if (aiSpeaking && listening) {
      setListening(false);
    }
  }, [aiSpeaking, listening, setListening]);

  // Auto-start mic when AI finishes speaking
  const wasAiSpeaking = useRef(aiSpeaking);
  useEffect(() => {
    if (wasAiSpeaking.current && !aiSpeaking && mode === "voice") {
      setListening(true);
    }
    wasAiSpeaking.current = aiSpeaking;
  }, [aiSpeaking, mode, setListening]);

  useEffect(() => {
    setListening(false);
    setText("");
    setError(null);
  }, [mode, setListening, setText]);

  const handleReset = () => {
    setText("");
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {aiSpeaking ? (
          <motion.div
            key="ai-speaking"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="flex items-center justify-between gap-6 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md"
          >
            <div className="flex items-center gap-10">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <AISpeakingBars />
                </div>
                <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur-sm animate-pulse" />
              </div>
              <div>
                <span className="text-xs text-white/40 block">thinking...</span>
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 border border-white/10 px-2 py-1 rounded">Processing</div>
          </motion.div>
        ) : (
          <motion.div
            key="user-controls"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-2"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex justify-center">
              <div className="bg-white/5 p-1 rounded-xl border border-white/10">
                <div className="flex gap-1">
                  {[
                    { id: 'voice', icon: Mic, label: 'Voice' },
                    { id: 'text', icon: Type, label: 'Text' }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setMode(btn.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        mode === btn.id 
                          ? 'bg-white/10 text-white shadow-lg' 
                          : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
                      }`}
                    >
                      <btn.icon className={`w-3.5 h-3.5 ${mode === btn.id ? 'text-blue-400' : ''}`} />
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {mode === "voice" ? (
                <motion.div
                  key="voice-mode"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center gap-6"
                >
                  <div className="relative group">
                    <button
                      onClick={() => setListening((s: any) => !s)}
                      className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                        listening 
                          ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                          : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
                      }`}
                    >
                      {listening ? (
                        <StopCircle className="w-10 h-10 animate-pulse" />
                      ) : (
                        <Mic className="w-10 h-10" />
                      )}
                    </button>
                    {listening && (
                      <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                    )}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                       <MicVisualizer active={listening} />
                    </div>
                  </div>

                  <div className="text-center space-y-4 w-full">
                    <p className={`text-sm font-medium transition-colors ${listening ? 'text-red-400' : 'text-white/40'}`}>
                      {listening ? "Go ahead, I'm listening..." : "Ready when you are"}
                    </p>
                    {text && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto"
                      >
                        <div className="relative group">
                          <p className="text-sm text-white/60 italic px-5 py-3 bg-white/5 rounded-2xl border border-white/10 text-left min-h-[60px]">
                            "{text}"
                          </p>
                          <button
                            onClick={handleReset}
                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white/10 border border-white/10 text-white/40 hover:text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                            title="Clear transcript"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex gap-3 justify-center mt-6">
                           <button
                             onClick={handleReset}
                             className="px-6 py-2.5 rounded-full border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-all"
                           >
                             Reset
                           </button>
                           <button
                             disabled={isTranscribing}
                             onClick={() => {
                               if (silenceTimeoutRef.current) {
                                 clearTimeout(silenceTimeoutRef.current);
                               }
                               handleFinalizeAndSend(text.trim());
                             }}
                             className="px-8 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                           >
                             {isTranscribing && <Loader2 className="w-4 h-4 animate-spin" />}
                             {isTranscribing ? "Finalizing..." : "Send Response"}
                           </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="text-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="w-full space-y-3"
                >
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all flex gap-2">
                    <Input
                      placeholder="Type your answer here..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && text.trim()) {
                          handleSend(text.trim());
                          setText("");
                        }
                      }}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-white/20 focus-visible:ring-0 px-4 py-6"
                    />
                    <div className="flex items-center gap-2 pr-2">
                      {text && (
                        <button
                          onClick={handleReset}
                          className="p-3 rounded-xl hover:bg-white/5 text-white/20 hover:text-white/60 transition-all"
                          title="Reset"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (text.trim()) {
                            handleSend(text.trim());
                            setText("");
                          }
                        }}
                        className="p-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-90 shadow-lg shadow-blue-600/20"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default InterviewControls;
