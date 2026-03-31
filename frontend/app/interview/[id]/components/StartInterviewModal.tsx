"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Orb from "@/components/Orb";
import React from "react";

interface StartInterviewModalProps {
  show: boolean;
  onStart: () => void;
}

const StartInterviewModal = React.memo(({ show, onStart }: StartInterviewModalProps) => {
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
            <p className="text-white/60 mb-8">
              Make sure your camera and microphone are working properly before we begin.
            </p>
            <Button
              onClick={onStart}
              className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
            >
              Launch Interview
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

StartInterviewModal.displayName = "StartInterviewModal";
export default StartInterviewModal;
