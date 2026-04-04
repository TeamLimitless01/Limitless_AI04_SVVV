"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const InterviewChatPane = React.memo(function InterviewChatPane({
  messages,
  isSpeechLoading,
}: any) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isSpeechLoading]);

  // Determine which messages to render
  const displayedMessages = React.useMemo(() => {
    if (!messages || messages.length === 0) return [];
    return messages;
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div
        ref={ref}
        className="flex-1 space-y-6 overflow-y-auto p-6 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {displayedMessages.map((m: any, i: number) => (
            <motion.div
              key={m.id || i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] rounded-[1.5rem] break-words whitespace-pre-wrap px-5 py-3.5 text-sm shadow-xl transition-shadow ${
                  m.role === "assistant"
                    ? "bg-white/[0.03] border border-white/10 text-white/90 rounded-bl-none shadow-black/20"
                    : "bg-blue-600 border border-blue-500 text-white rounded-br-none shadow-blue-500/10"
                }`}
              >
                {Array.isArray(m.content)
                  ? m.content?.map((cont: any, idx: number) => (
                      <div key={idx}>
                        {cont.type === "image_url" ? (
                          <motion.img
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="my-3 max-h-96 w-auto rounded-2xl border border-white/10 shadow-lg"
                            alt="Visual Context"
                            src={cont.image_url.url}
                          />
                        ) : (
                          <p className="leading-relaxed">{cont.text}</p>
                        )}
                      </div>
                    ))
                  : <p className="leading-relaxed">{m.content}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isSpeechLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] rounded-bl-none px-5 py-3.5 text-sm flex items-center gap-3 shadow-xl">
              <div className="flex gap-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400/60"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400/30"
                />
              </div>
              <span className="text-white/40 font-medium tracking-wide">Generating response...</span>
            </div>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
});

export default InterviewChatPane;
