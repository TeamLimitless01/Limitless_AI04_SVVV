"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Orb from "@/components/Orb";
import React, { useState } from "react";
import { AlertCircle, Mic } from "lucide-react";

interface StartInterviewModalProps {
  show: boolean;
  onStart: (audioStream: MediaStream) => Promise<void>;
}

const StartInterviewModal = React.memo(({ show, onStart }: StartInterviewModalProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVoiceInterview = async () => {
    setIsStarting(true);
    setError(null);
    let audioStream: MediaStream | undefined;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is unavailable in this browser.");
      }

      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const stream = audioStream;
      await onStart(stream);
      audioStream = undefined;
    } catch (startError) {
      audioStream?.getTracks().forEach((track) => track.stop());
      const message =
        startError instanceof Error
          ? startError.name === "NotAllowedError" || startError.name === "PermissionDeniedError"
            ? "Microphone access was denied. Allow microphone permission in your browser and retry."
            : startError.name === "NotFoundError" || startError.name === "DevicesNotFoundError"
              ? "No microphone was found. Connect a microphone and retry."
              : startError.name === "NotReadableError" || startError.name === "TrackStartError"
                ? "The microphone is unavailable or in use by another app. Close other apps using it and retry."
                : startError.message
          : "Could not access the microphone. Check your device and browser permissions, then retry.";
      setError(message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
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
            <p className="text-white/60 mb-6 text-sm leading-relaxed">
              Start an audio interview using your microphone. Your interview transcript is saved to
              create your report. Camera is off unless you enable it, and is only used for an
              in-browser person-presence check, not scoring.
            </p>
            {error && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-left text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={startVoiceInterview}
                disabled={isStarting}
                className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
              >
                <Mic className="mr-2 h-5 w-5" />
                {isStarting ? "Connecting..." : "Start audio interview"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

StartInterviewModal.displayName = "StartInterviewModal";
export default StartInterviewModal;
