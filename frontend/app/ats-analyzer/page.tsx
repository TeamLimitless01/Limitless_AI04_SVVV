"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
  UploadCloud,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type AnalysisCategory = {
  name: string;
  score: number;
  feedback: string;
};

type Suggestion = {
  priority: "high" | "medium" | "low";
  category: string;
  recommendation: string;
  why: string;
};

type Analysis = {
  overallScore: number;
  hasJobDescription: boolean;
  summary: string;
  categories: AnalysisCategory[];
  suggestions: Suggestion[];
  matchedKeywords: string[];
  missingKeywords: string[];
};

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const MAX_JD_SIZE = 3 * 1024 * 1024;
const MAX_JD_TEXT_LENGTH = 12_000;

async function validatePdf(file: File, maxSize: number, label: string): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return `${label} must be a PDF file.`;
  }
  if (file.size === 0) return `${label} is empty.`;
  if (file.size > maxSize) {
    return `${label} must be ${Math.floor(maxSize / (1024 * 1024))} MB or smaller.`;
  }
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-") {
    return `${label} does not appear to be a valid PDF.`;
  }
  return null;
}

function ScoreBar({ category }: { category: AnalysisCategory }) {
  const color = category.score >= 75
    ? "bg-emerald-500"
    : category.score >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-100">{category.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{category.feedback}</p>
        </div>
        <span className="shrink-0 text-lg font-bold tabular-nums text-white">{category.score}%</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={`${category.name} estimated score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={category.score}
      >
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${category.score}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function ATSAnalyzerPage() {
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onResumeChange = async (file?: File) => {
    setError("");
    if (!file) return;
    const validationError = await validatePdf(file, MAX_RESUME_SIZE, "Resume");
    if (validationError) {
      setResume(null);
      setError(validationError);
      return;
    }
    setResume(file);
    setAnalysis(null);
  };

  const onJdFileChange = async (file?: File) => {
    setError("");
    if (!file) return;
    if (jdText.trim()) {
      setError("Remove the pasted job description before uploading a PDF.");
      if (jdInputRef.current) jdInputRef.current.value = "";
      return;
    }
    const validationError = await validatePdf(file, MAX_JD_SIZE, "Job description");
    if (validationError) {
      setJdFile(null);
      setError(validationError);
      return;
    }
    setJdFile(file);
    setAnalysis(null);
  };

  const analyzeResume = async () => {
    setError("");
    if (!resume) {
      setError("Upload your resume PDF to start the analysis.");
      return;
    }
    if (jdText.trim().length > MAX_JD_TEXT_LENGTH) {
      setError(`Job description must be ${MAX_JD_TEXT_LENGTH.toLocaleString()} characters or fewer.`);
      return;
    }
    if (jdText.trim() && jdText.trim().length < 80) {
      setError("Add at least 80 characters for a useful job-description comparison, or leave it blank.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    const formData = new FormData();
    formData.append("resume", resume);
    if (jdFile) formData.append("jobDescriptionFile", jdFile);
    if (jdText.trim()) formData.append("jobDescriptionText", jdText.trim());

    try {
      const response = await fetch("/api/ats/analyze", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not analyze this resume.");
      setAnalysis(data as Analysis);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to analyze this resume right now.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResume(null);
    setJdFile(null);
    setJdText("");
    setAnalysis(null);
    setError("");
    if (resumeInputRef.current) resumeInputRef.current.value = "";
    if (jdInputRef.current) jdInputRef.current.value = "";
  };

  return (
    <main className="min-h-screen px-4 pb-16 pt-32 sm:px-6">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-20 top-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -left-20 bottom-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>
      <div className="mx-auto max-w-5xl">
        <Link
          href="/career"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Career Hub
        </Link>

        <header className="mb-8 sm:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> Resume feedback, grounded in your documents
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">ATS Resume Analyzer</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Review resume readability, experience, skills, and structure. Add a job description for a more specific match analysis.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="h-fit rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-300"><FileCheck2 className="h-5 w-5" /></div>
              <div>
                <h2 className="font-bold text-white">Your documents</h2>
                <p className="text-xs text-slate-500">PDF files are processed for this review and not saved in chat history.</p>
              </div>
            </div>

            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => void onResumeChange(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              className="flex min-h-28 w-full items-center gap-4 rounded-2xl border border-dashed border-indigo-400/30 bg-indigo-500/[0.05] p-4 text-left transition-colors hover:border-indigo-400/60 hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <div className="rounded-xl bg-indigo-500/15 p-3 text-indigo-300"><UploadCloud className="h-5 w-5" /></div>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-100">Resume PDF <span className="text-rose-400">*</span></span>
                <span className="mt-1 block truncate text-sm text-slate-400">{resume?.name || "Choose a file · up to 5 MB"}</span>
              </span>
              {resume && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
            </button>

            <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="h-px flex-1 bg-white/10" /> Optional job description <span className="h-px flex-1 bg-white/10" />
            </div>

            <label htmlFor="jd-text" className="mb-2 block text-sm font-medium text-slate-300">
              Paste job description
            </label>
            <textarea
              id="jd-text"
              value={jdText}
              maxLength={MAX_JD_TEXT_LENGTH}
              disabled={Boolean(jdFile) || isAnalyzing}
              onChange={(event) => {
                setJdText(event.target.value);
                setError("");
                setAnalysis(null);
              }}
              placeholder="Paste the role requirements here for a tailored keyword match..."
              className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
              aria-describedby="jd-character-count"
            />
            <div id="jd-character-count" className="mt-1 text-right text-xs text-slate-500">
              {jdText.length.toLocaleString()} / {MAX_JD_TEXT_LENGTH.toLocaleString()}
            </div>

            <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-white/10" /> or upload PDF <span className="h-px flex-1 bg-white/10" />
            </div>
            <input
              ref={jdInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(event) => void onJdFileChange(event.target.files?.[0])}
            />
            {jdFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <FileText className="h-5 w-5 shrink-0 text-indigo-300" />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{jdFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove job description PDF"
                  onClick={() => {
                    setJdFile(null);
                    if (jdInputRef.current) jdInputRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                disabled={Boolean(jdText.trim()) || isAnalyzing}
                onClick={() => jdInputRef.current?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" /> Upload job description PDF
              </Button>
            )}

            <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-100/75">
              This is an AI-generated estimate, not a score from a real ATS. Avoid uploading documents with sensitive information you do not want processed by the configured AI provider.
            </div>

            {error && (
              <div role="alert" className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <Button type="button" className="h-12 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500" disabled={!resume || isAnalyzing} onClick={analyzeResume}>
                {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing documents...</> : <><Sparkles className="mr-2 h-4 w-4" /> Analyze resume</>}
              </Button>
              {(analysis || resume || jdFile || jdText) && (
                <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={reset} disabled={isAnalyzing} aria-label="Start over">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </section>

          <section aria-live="polite" className="min-h-96 rounded-3xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-xl sm:p-6">
            {isAnalyzing ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-indigo-400/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <FileCheck2 className="h-7 w-7 text-indigo-300" />
                </div>
                <h2 className="text-lg font-bold text-white">Reviewing your documents</h2>
                <p className="mt-2 text-sm text-slate-400">Extracting text and evaluating resume evidence...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Estimated ATS readiness</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {analysis.hasJobDescription ? "Compared with the supplied job description" : "General resume review · no job description"}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tabular-nums text-white">{analysis.overallScore}</span>
                    <span className="text-lg text-slate-500">/100</span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-300">{analysis.summary}</p>

                <div className="space-y-3">
                  {analysis.categories.map((category) => <ScoreBar key={category.name} category={category} />)}
                </div>

                {analysis.hasJobDescription && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Found in resume
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.matchedKeywords.length ? analysis.matchedKeywords.map((keyword) => (
                          <span key={keyword} className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-100">{keyword}</span>
                        )) : <p className="text-xs text-slate-500">No clear matches identified.</p>}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-300">
                        <Target className="h-4 w-4" /> Consider addressing
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingKeywords.length ? analysis.missingKeywords.map((keyword) => (
                          <span key={keyword} className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-100">{keyword}</span>
                        )) : <p className="text-xs text-slate-500">No major gaps identified.</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-lg font-bold text-white">Suggested next steps</h3>
                  <div className="space-y-3">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={`${suggestion.category}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            suggestion.priority === "high" ? "bg-rose-500/15 text-rose-300" :
                            suggestion.priority === "medium" ? "bg-amber-500/15 text-amber-300" :
                            "bg-slate-500/15 text-slate-300"
                          }`}>{suggestion.priority} priority</span>
                          <span className="text-xs text-slate-500">{suggestion.category}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-100">{suggestion.recommendation}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{suggestion.why}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-center text-[11px] text-slate-500">
                  Scores are estimates based on extracted text and do not predict a specific employer&apos;s ATS.
                </p>
              </div>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center px-4 text-center">
                <div className="mb-4 rounded-2xl border border-indigo-400/15 bg-indigo-500/10 p-4 text-indigo-300">
                  <FileCheck2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-white">Your review will appear here</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                  Upload a resume to see estimated score bars and practical suggestions. Add a job description for role-specific keyword feedback.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
