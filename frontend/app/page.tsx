"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Hero from "@/components/hero";
import AnimatedSection from "@/components/animated-section";
import NumberTicker from "@/components/number-ticker";
import { ArrowRight, Bot, Camera, BarChart3, Brain, TrendingUp, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen selection:bg-blue-500/30">
      {/* Background Decoratives */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        <section className="container mx-auto px-6 py-32 md:py-48 flex flex-col items-center">
          <Hero />
          <motion.div
            className="mt-12 flex flex-col sm:flex-row items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <Button asChild size="lg" className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-slate-100 dark:bg-white dark:text-black font-bold text-lg shadow-2xl shadow-white/10 group transition-all">
              <Link href="/create-interview">
                Start Practicing
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-2xl border-white/20 hover:bg-white/5 hover:text-white  font-semibold text-lg backdrop-blur-sm transition-all">
              <Link href="/roadmap-chat">Explore Features</Link>
            </Button>
          </motion.div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: 12400, suffix: "+", label: "Interviews Practiced", icon: <Bot className="h-6 w-6 text-blue-400" /> },
              { value: 98, suffix: "%", label: "User Satisfaction", icon: <TrendingUp className="h-6 w-6 text-emerald-400" /> },
              { value: 450, suffix: "+", label: "Hired at FAANG", icon: <Sparkles className="h-6 w-6 text-amber-400" /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="glass-card p-10 rounded-[2.5rem] flex flex-col items-center text-center group hover:translate-y-[-4px] transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="p-4 rounded-2xl bg-white/5 mb-6 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-5xl font-extrabold mb-2 tracking-tighter">
                  <NumberTicker value={stat.value} />
                  <span className="text-blue-500">{stat.suffix}</span>
                </div>
                <p className="text-slate-400 font-medium tracking-wide opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <AnimatedSection id="features">
          <section className="container mx-auto px-6 py-32">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                Why <span className="text-gradient">NeuraView?</span>
              </h2>
              <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                We've combined advanced computer vision with next-generation LLMs to provide a 
                mirror for your professional excellence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Real-time AI Feedback",
                  desc: "Our AI doesn't just listen; it understands context, technical depth, and industry relevance.",
                  icon: <Brain className="h-7 w-7" />,
                  color: "blue"
                },
                {
                  title: "Expression Analysis",
                  desc: "Track eye contact, confidence levels, and emotional intelligence through video feedback.",
                  icon: <Camera className="h-7 w-7" />,
                  color: "purple"
                },
                {
                  title: "Smart Metrics",
                  desc: "Comprehensive scoring based on content, clarity, and non-verbal communication.",
                  icon: <BarChart3 className="h-7 w-7" />,
                  color: "emerald"
                },
                {
                  title: "Custom Scenarios",
                  desc: "From HR rounds to complex architecture interviews, tailor your practice perfectly.",
                  icon: <Zap className="h-7 w-7" />,
                  color: "amber"
                },
                {
                  title: "FAANG Roadmaps",
                  desc: "Get specific feedback tailored to the hiring criteria of top-tier technology companies.",
                  icon: <TrendingUp className="h-7 w-7" />,
                  color: "indigo"
                },
                {
                  title: "Global Standards",
                  desc: "Trained on thousands of successful interviews across different cultures and industries.",
                  icon: <Sparkles className="h-7 w-7" />,
                  color: "rose"
                }
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  className="glass-card p-10 rounded-[2.5rem] hover:bg-white/5 transition-all group border-white/5"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i, duration: 0.7 }}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-${feature.color}-500/10 text-${feature.color}-400 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection className="bg-white/2">
          <section className="container mx-auto px-6 py-32">
            <div className="max-w-6xl mx-auto glass-card rounded-[4rem] p-12 md:p-24 overflow-hidden relative border-white/5">
              <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">
                    Your journey to a <span className="text-gradient">Dream Job</span> starts here.
                  </h2>
                  <div className="space-y-8">
                    {[
                      { step: "01", title: "Select Your Goal", desc: "Choose from our preset roles or create a custom interview." },
                      { step: "02", title: "Practice with AI", desc: "Our AI asks deep questions while analyzing your performance." },
                      { step: "03", title: "Get Deep Insights", desc: "Receive a full report on your strengths and blind spots." }
                    ].map((s) => (
                      <div key={s.step} className="flex gap-6 items-start">
                        <span className="text-blue-500 font-mono font-bold text-xl">{s.step}</span>
                        <div>
                          <h4 className="font-bold text-xl mb-1">{s.title}</h4>
                          <p className="text-slate-400">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative flex justify-center lg:justify-end">
                  <div className="w-full max-w-md aspect-square rounded-[3rem] bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-3xl flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
                    <Bot className="w-32 h-32 text-white/40 animate-bounce" />
                    <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-3xl animate-pulse">
                      <TrendingUp className="h-8 w-8 text-emerald-400 mb-2" />
                      <div className="text-xs font-bold text-slate-400 mb-1">IMPROVEMENT</div>
                      <div className="text-2xl font-bold">+42%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        <section className="container mx-auto px-6 py-40">
          <div className="glass-card rounded-[3.5rem] p-12 md:p-24 text-center border-none bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tighter">
                Ready to crush your next interview?
              </h2>
              <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium">
                Join developers who have used NeuraView to unlock their career potential.
              </p>
              <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-white text-blue-600 hover:bg-slate-100 font-bold text-xl shadow-2xl transition-all">
                <Link href="/create-interview">
                  Get Started for Free ↗
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="container mx-auto px-6 py-20 border-t border-white/5 text-center">
          <p className="text-slate-500 font-medium">© 2026 NeuraView AI. Engineering Premium Careers.</p>
        </footer>
      </div>
    </main>
  );
}
