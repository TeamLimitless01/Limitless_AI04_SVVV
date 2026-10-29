import Link from "next/link";
import Hero from "@/components/hero";
import GradientWaves from "@/components/GradientWaves";
import AnimatedSection from "@/components/animated-section";
import NumberTicker from "@/components/number-ticker";
import {
  ArrowRight,
  Bot,
  Camera,
  BarChart3,
  Brain,
  TrendingUp,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen selection:bg-blue-500/30">
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <GradientWaves
          horizonColor="#2563EB"
          waveColor="#7C3AED"
          crestColor="#DBEAFE"
          speed={0.25}
          amplitude={2}
          relief={0.8}
          opacity={0.7}
          grain={0.08}
          quality="low"
          dpr={1.25}
          mouseInteraction
          swellOnClick={false}
          style={{ position: "absolute", inset: 0 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/35 to-slate-950/60" />
      </div>

      <div className="relative z-10">
        <section className="container mx-auto flex flex-col items-center px-4 pt-24 pb-10 sm:px-6 sm:py-32 md:py-44">
          <Hero />
          <div className="mt-8 flex w-full flex-col items-stretch gap-3 px-2 sm:mt-12 sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:px-0">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-2xl bg-white px-6 text-base font-bold text-black shadow-2xl shadow-white/10 transition-all group hover:bg-slate-100 dark:bg-white dark:text-black sm:h-14 sm:px-10 sm:text-lg"
            >
              <Link href="/create-interview">
                Start Practicing
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-2xl border-white/20 px-6 text-base font-semibold backdrop-blur-sm transition-all hover:bg-white/5 hover:text-white sm:h-14 sm:px-10 sm:text-lg"
            >
              <Link href="/roadmap-chat">Explore Features</Link>
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {[
              {
                value: 12400,
                suffix: "+",
                label: "Interviews Practiced",
                icon: <Bot className="h-6 w-6 text-blue-400" />,
              },
              {
                value: 98,
                suffix: "%",
                label: "User Satisfaction",
                icon: <TrendingUp className="h-6 w-6 text-emerald-400" />,
              },
              {
                value: 450,
                suffix: "+",
                label: "Hired at FAANG",
                icon: <Sparkles className="h-6 w-6 text-amber-400" />,
              },
            ].map((stat) => (
              <div
              key={stat.label}
              className="glass-card flex flex-col items-center rounded-3xl p-5 text-center transition-all group hover:translate-y-[-4px] sm:rounded-[2.5rem] sm:p-10"
              >
                <div className="p-4 rounded-2xl bg-white/5 mb-6 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="mb-2 text-4xl font-extrabold tracking-tighter sm:text-5xl">
                  <NumberTicker value={stat.value} />
                  <span className="text-blue-500">{stat.suffix}</span>
                </div>
                <p className="text-slate-400 font-medium tracking-wide opacity-80">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <AnimatedSection id="features">
          <section className="container mx-auto px-4 py-14 sm:px-6 sm:py-28 md:py-32">
            <div className="mb-12 text-center sm:mb-16 md:mb-24">
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:mb-6 sm:text-4xl md:text-6xl">
                Why <span className="text-gradient">NeuraView?</span>
              </h2>
              <p className="mx-auto max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
                Practice interview answers with AI-powered conversations and an
                optional camera presence check.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {[
                {
                  title: "Real-time AI Feedback",
                  desc: "Our AI doesn't just listen; it understands context, technical depth, and industry relevance.",
                  icon: <Brain className="h-7 w-7" />,
                  color: "blue",
                },
                {
                  title: "Optional Camera Check",
                  desc: "Enable your camera to confirm a person is visible during the interview. Camera presence is not used to score your report.",
                  icon: <Camera className="h-7 w-7" />,
                  color: "purple",
                },
                {
                  title: "Answer-Based Evaluation",
                  desc: "Get interview feedback based on your answers, technical depth, and communication.",
                  icon: <BarChart3 className="h-7 w-7" />,
                  color: "emerald",
                },
                {
                  title: "Custom Scenarios",
                  desc: "From HR rounds to complex architecture interviews, tailor your practice perfectly.",
                  icon: <Zap className="h-7 w-7" />,
                  color: "amber",
                },
                {
                  title: "FAANG Roadmaps",
                  desc: "Get specific feedback tailored to the hiring criteria of top-tier technology companies.",
                  icon: <TrendingUp className="h-7 w-7" />,
                  color: "indigo",
                },
                {
                  title: "Global Standards",
                  desc: "Trained on thousands of successful interviews across different cultures and industries.",
                  icon: <Sparkles className="h-7 w-7" />,
                  color: "rose",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="glass-card rounded-3xl border-white/5 p-6 transition-all group hover:bg-white/5 sm:rounded-[2.5rem] sm:p-8 lg:p-10"
                >
                  <div
                    className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-${feature.color}-500/10 text-${feature.color}-400 transition-transform group-hover:scale-110 sm:mb-8 sm:h-14 sm:w-14`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection className="bg-white/2">
          <section className="container mx-auto px-4 py-20 sm:px-6 sm:py-28 md:py-32">
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border-white/5 p-5 glass-card sm:rounded-[3rem] sm:p-8 md:rounded-[4rem] md:p-12 lg:p-20">
              <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />
              <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div>
                  <h2 className="mb-6 text-3xl font-extrabold tracking-tight sm:mb-8 sm:text-4xl md:text-5xl">
                    Your journey to a{" "}
                    <span className="text-gradient">Dream Job</span> starts
                    here.
                  </h2>
                  <div className="space-y-6 sm:space-y-8">
                    {[
                      {
                        step: "01",
                        title: "Select Your Goal",
                        desc: "Choose from our preset roles or create a custom interview.",
                      },
                      {
                        step: "02",
                        title: "Practice with AI",
                        desc: "Our AI asks deep questions while analyzing your performance.",
                      },
                      {
                        step: "03",
                        title: "Get Deep Insights",
                        desc: "Receive a full report on your strengths and blind spots.",
                      },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className="flex items-start gap-4 sm:gap-6"
                      >
                        <span className="text-blue-500 font-mono font-bold text-xl">
                          {s.step}
                        </span>
                        <div>
                          <h4 className="mb-1 text-lg font-bold sm:text-xl">
                            {s.title}
                          </h4>
                          <p className="text-slate-400">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative flex justify-center lg:justify-end">
                  <div className="relative flex aspect-square w-full max-w-xs items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl group sm:max-w-md sm:rounded-[3rem]">
                    <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
                    <Bot className="h-20 w-20 text-white/40 animate-bounce sm:h-32 sm:w-32" />
                    <div className="absolute bottom-2 left-2 rounded-2xl p-4 glass-card animate-pulse sm:-bottom-6 sm:-left-6 sm:rounded-3xl sm:p-6">
                      <TrendingUp className="mb-2 h-6 w-6 text-emerald-400 sm:h-8 sm:w-8" />
                      <div className="text-xs font-bold text-slate-400 mb-1">
                        IMPROVEMENT
                      </div>
                      <div className="text-2xl font-bold">+42%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        <section className="container mx-auto px-4 py-14 sm:px-6 sm:py-28 md:py-36">
          <div className="glass-card relative overflow-hidden rounded-3xl border-none bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center group sm:rounded-[3.5rem] sm:p-10 md:p-16 lg:p-24">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />

            <div className="relative z-10">
              <h2 className="mb-5 text-3xl font-extrabold tracking-tighter text-white sm:mb-8 sm:text-4xl md:text-6xl">
                Ready to crush your next interview?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-base font-medium text-blue-100 sm:mb-12 sm:text-lg md:text-xl">
                Join developers who have used NeuraView to unlock their career
                potential.
              </p>
              <Button
                asChild
                size="lg"
                className="h-12 rounded-2xl bg-white px-6 text-base font-bold text-blue-600 shadow-2xl transition-all hover:bg-slate-100 sm:h-16 sm:px-12 sm:text-xl"
              >
                <Link href="/create-interview">Get Started for Free ↗</Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="container mx-auto border-t border-white/5 px-4 py-12 text-center sm:px-6 sm:py-20">
          <p className="text-sm font-medium text-slate-500 sm:text-base">
            © 2026 NeuraView AI. Engineering Premium Careers.
          </p>
        </footer>
      </div>
    </main>
  );
}
