"use client";

import SpotlightCard from "@/components/ui/soptlight-card";
import Link from "next/link";
import React, { useState } from "react";
import { MapPin, MessageSquare, ArrowRight, Eye, Sparkles, LayoutDashboard, BrainCircuit, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const ServicesPage = () => {
  const router = useRouter();
  
  const roadmap = typeof window !== 'undefined' ? window.localStorage.getItem("roadmap") : null;

  const cards = [
    {
      id: "interview",
      title: "AI Interviews",
      description: "Engage in hyper-realistic technical and HR mock interviews with real-time video feedback.",
      icon: BrainCircuit,
      color: "blue",
      href: "/create-interview",
      cta: "Start Practicing"
    },
    {
      id: "roadmap",
      title: "Growth Roadmaps",
      description: "Personalized learning paths tailored to your target role at FAANG or top-tier startups.",
      icon: MapPin,
      color: "emerald",
      href: "/roadmap",
      cta: "Generate Path"
    },
    {
      id: "chat",
      title: "Career Assistant",
      description: "24/7 access to your personal AI mentor for resume reviews and salary negotiation tips.",
      icon: MessageSquare,
      color: "purple",
      href: "/chat",
      cta: "Chat with Neura"
    },
    {
      id: "summarize",
      title: "AI Summarizer",
      description: "Transform long PDFs and notes into concise, actionable summaries and interactive quizzes.",
      icon: FileText,
      color: "orange",
      href: "/summarize",
      cta: "Summarize Now"
    },
  ];

  return (
    <main className="relative min-h-screen bg-transparent selection:bg-blue-500/30 overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 dark:bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] bg-purple-500/5 dark:bg-purple-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 py-32 md:py-48">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24 max-w-3xl"
        >
          {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="h-3 w-3" />
            <span>Elevate Your Professional Value</span>
          </div> */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">
            Our <span className="text-gradient">Core Services</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
            Every tool you need to transition from "Applying" to "Hired." 
            Engineered with next-generation AI to guarantee professional growth.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="group h-full"
            >
              <SpotlightCard 
                className="h-full !bg-slate-900/40 !border-white/5 !rounded-[3rem] p-10 backdrop-blur-3xl flex flex-col relative overflow-hidden group/card transition-all hover:!bg-slate-900/60"
                spotlightColor={
                  card.color === 'blue' ? 'rgba(59, 130, 246, 0.15)' : 
                  card.color === 'emerald' ? 'rgba(16, 185, 129, 0.15)' : 
                  card.color === 'orange' ? 'rgba(249, 115, 22, 0.15)' : 
                  'rgba(168, 85, 247, 0.15)'
                }
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}-500/10 blur-3xl rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 bg-${card.color}-500/10 text-${card.color}-400 group-hover/card:scale-110 transition-transform shadow-inner`}>
                    <card.icon className="w-7 h-7" />
                  </div>

                  <h2 className="text-3xl font-extrabold text-white mb-6 tracking-tight">
                    {card.title}
                  </h2>

                  <p className="text-slate-400 text-lg leading-relaxed mb-10 flex-grow">
                    {card.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-white/5">
                    {card.id === "roadmap" ? (
                      <div className="flex flex-col gap-3">
                        {roadmap && (
                          <Button 
                            variant="outline"
                            className="w-full h-12 rounded-2xl border-white/10 hover:bg-white/5 font-bold"
                            onClick={() => router.push("/roadmap")}
                          >
                            View Recent Path
                          </Button>
                        )}
                        <Button 
                          className={`w-full h-12 rounded-2xl bg-white text-black hover:bg-slate-100 font-bold shadow-xl`}
                          onClick={() => {
                            window.localStorage.removeItem("roadmap");
                            router.push("/roadmap");
                          }}
                        >
                          Generate New Path
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        asChild
                        className={`w-full h-14 rounded-[1.5rem] bg-white text-black hover:bg-slate-100 font-bold group/btn shadow-2xl shadow-black/20`}
                      >
                        <Link href={card.href} className="flex items-center justify-center gap-2">
                          {card.cta}
                          <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Bottom Feature Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-32 w-full max-w-5xl glass-card rounded-[2.5rem] p-8 md:p-12 text-center"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Sparkles, text: "FAANG Aligned" },
              { icon: LayoutDashboard, text: "Progress Sync" },
              { icon: MessageSquare, text: "24/7 Coaching" },
              { icon: Eye, text: "Real-time Vision" }
            ].map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <f.icon className="h-6 w-6 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{f.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default ServicesPage;
