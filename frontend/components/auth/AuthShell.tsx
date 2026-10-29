"use client";

import { motion } from "framer-motion";
import { ArrowRight, AudioLines, Check, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

const highlights = [
  "Practice with realistic conversations",
  "Get feedback grounded in your answers",
  "Build confidence one interview at a time",
];

export default function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden px-4 pb-8 pt-28 sm:px-6 sm:pb-10 sm:pt-32 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-blue-500/15 blur-[120px]"
          animate={{ x: [0, 35, 0], y: [0, 25, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-violet-500/15 blur-[130px]"
          animate={{ x: [0, -30, 0], y: [0, -24, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,64,175,0.12),transparent_55%)]" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.section
          className="hidden px-4 lg:block"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/[0.07] px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            YOUR NEXT INTERVIEW STARTS HERE
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-white xl:text-5xl">
            A little practice can change{" "}
            <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
              everything.
            </span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
            Make your next interview feel familiar. Practice out loud, explore
            your ideas, and learn from feedback that helps you move forward.
          </p>

          <div className="mt-9 space-y-4">
            {highlights.map((highlight, index) => (
              <motion.div
                key={highlight}
                className="flex items-center gap-3 text-sm text-slate-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.1, duration: 0.4 }}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {highlight}
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex max-w-lg items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-950/35 p-4 backdrop-blur-xl">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-blue-200">
              <AudioLines className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                Practice at your pace
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Every session is a chance to get more comfortable.
              </p>
            </div>
            <Target className="h-5 w-5 shrink-0 text-slate-500" />
          </div>
        </motion.section>

        <motion.section
          className="mx-auto w-full max-w-md"
          initial={{ opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <Link
            href="/"
            className="mb-7 inline-flex items-center gap-2 lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-blue-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-bold tracking-tight text-white">
              Neura<span className="text-blue-400">View</span>
            </span>
          </Link>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_100px_rgba(2,6,23,0.5)] backdrop-blur-2xl sm:p-9">
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative">
              <div className="mt-1 sm:mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                  {eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </div>

              <div className="mt-7">{children}</div>
              <div className="mt-6 border-t border-white/[0.08] pt-5 text-center text-sm text-slate-400">
                {footer}
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-500">
            Your information is used to personalize your interview practice.
          </p>
        </motion.section>
      </div>
    </main>
  );
}
