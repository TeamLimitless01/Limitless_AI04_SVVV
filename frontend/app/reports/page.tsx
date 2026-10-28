"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStrapi } from "@/lib/api/useStrapi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, RotateCcw, ChevronRight, Calendar, Target, Layers, Sparkles, X, DownloadCloud, Loader2 } from "lucide-react";
import InterviewReport from "./ReportUi";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";

function parseInterviewReport(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string" && (!value || typeof value !== "object")) return null;
  try {
    const report: unknown = typeof value === "string" ? JSON.parse(value) : value;
    if (!report || typeof report !== "object" || Array.isArray(report)) return null;

    const record = report as Record<string, unknown>;
    const knownSections = [
      "scores",
      "scorecard",
      "candidateInformation",
      "answerAnalysis",
      "overallPerformance",
      "summaryAndNextSteps",
    ];
    return knownSections.some((section) => {
      const content = record[section];
      return content && typeof content === "object" && Object.keys(content).length > 0;
    }) ? record : null;
  } catch {
    return null;
  }
}

function hasEnoughTranscript(conversation: unknown): boolean {
  if (!Array.isArray(conversation)) return false;
  const messages = conversation.filter(
    (message): message is { role: string; content: string } =>
      Boolean(
        message &&
        typeof message === "object" &&
        (message.role === "assistant" || message.role === "user") &&
        typeof message.content === "string" &&
        message.content.trim().length >= 15,
      ),
  );
  const interviewerTurns = messages.filter((message) => message.role === "assistant").length;
  const candidateTurns = messages.filter((message) => message.role === "user").length;
  const transcriptLength = messages.reduce((total, message) => total + message.content.trim().length, 0);
  return interviewerTurns >= 2 && candidateTurns >= 2 && transcriptLength >= 180;
}

function ReportsContent() {
  const { data: user } = useSession<any>();
  const router = useRouter();
  const { data, error, isLoading, mutate } = useStrapi("interviews", {
    filters: { user: user?.user?.id },
    sort: ["updatedAt:desc"],
    pagination: { limit: 100 }
  });

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");
  const lastProcessedId = useRef<string | null>(null);

  // Force revalidation whenever we land here with an interviewId (e.g. after a redirect)
  useEffect(() => {
    if (interviewId) {
      mutate();
    }
  }, [interviewId, mutate]);

  useEffect(() => {
    if (interviewId && data?.data?.length > 0) {
      if (lastProcessedId.current === interviewId) return;

      const interview = data.data.find(
        (i: any) => i.documentId === interviewId || i.id?.toString() === interviewId
      );

      if (interview) {
        const parsed = parseInterviewReport(interview.report);
        const transcriptReady = hasEnoughTranscript(interview.conversation);
        const availableReport = parsed && transcriptReady ? parsed : null;
        if (availableReport) {
          setSelectedReport(availableReport);
          lastProcessedId.current = interviewId;
        }
      }
    }
  }, [interviewId, data]);

  const handleGenerateNotes = async (interview: any) => {
    if (!parseInterviewReport(interview.report)) {
      toast.error("Interview notes are available after a report has been generated.");
      return;
    }
    if (!hasEnoughTranscript(interview.conversation)) {
      toast.error("Complete at least two interview questions and answers before generating improvements.");
      return;
    }

    setIsGeneratingNotes(interview.id || interview.documentId);
    try {
      const toastId = toast.loading("AI is generating notes...");

      const response = await fetch("/api/interview/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: interview.conversation,
          interviewDetails: {
            topic: interview.details,
            skills: interview.skills,
            mode: interview.mode || 'Technical'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Could not generate interview notes.");
      }
      const data = await response.json();
      if (!Array.isArray(data.notes) || data.notes.length === 0) {
        throw new Error("No interview questions were found to include in the notes.");
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const left = 18;
      const right = pageWidth - 18;
      const contentWidth = right - left;
      const bottom = pageHeight - 20;
      let y = 0;

      const addPageHeader = (continued: boolean) => {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 29, "F");
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 29, pageWidth, 1.2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text("NeuraView", left, 13);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(191, 219, 254);
        doc.text(continued ? "INTERVIEW IMPROVEMENT NOTES · CONTINUED" : "INTERVIEW IMPROVEMENT NOTES", left, 21);
        y = 40;
      };

      const addPage = () => {
        doc.addPage();
        addPageHeader(true);
      };

      const ensureSpace = (height: number) => {
        if (y + height > bottom) addPage();
      };

      const addSectionHeading = (text: string, color: [number, number, number]) => {
        ensureSpace(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...color);
        doc.text(text.toUpperCase(), left, y);
        y += 6;
      };

      const addParagraph = (
        text: string,
        options: {
          fontSize?: number;
          color?: [number, number, number];
          fontStyle?: "normal" | "italic" | "bold";
          indent?: number;
          gap?: number;
        } = {},
      ) => {
        const value = typeof text === "string" && text.trim() ? text.trim() : "No response recorded.";
        const fontSize = options.fontSize ?? 10;
        const indent = options.indent ?? 0;
        const gap = options.gap ?? 4;
        doc.setFont("helvetica", options.fontStyle ?? "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(...(options.color ?? [71, 85, 105]));
        const lines = doc.splitTextToSize(value, contentWidth - indent) as string[];
        const paragraphLineHeight = fontSize * 0.48;

        lines.forEach((line) => {
          ensureSpace(paragraphLineHeight + 1);
          doc.text(line, left + indent, y);
          y += paragraphLineHeight;
        });
        y += gap;
      };

      addPageHeader(false);

      const title = String(interview.details || "Interview Practice Session").slice(0, 240);
      const titleLines = doc.splitTextToSize(title, contentWidth - 10) as string[];
      const candidateLines = doc.splitTextToSize(
        `Candidate: ${String(interview.candidateName || "Candidate").slice(0, 80)}`,
        contentWidth / 2 - 8,
      ) as string[];
      const dateLines = doc.splitTextToSize(
        `Date: ${interview.createdAt && !Number.isNaN(new Date(interview.createdAt).getTime())
          ? new Date(interview.createdAt).toLocaleDateString()
          : "Date unavailable"}`,
        contentWidth / 2 - 8,
      ) as string[];
      const roleLines = doc.splitTextToSize(
        `Mode: ${String(interview.mode || "Technical").slice(0, 50)}   |   Skills: ${String(interview.skills || "General").slice(0, 220)}`,
        contentWidth - 10,
      ) as string[];
      const titleY = 14;
      const candidateY = titleY + titleLines.length * 5.5 + 3;
      const roleY = candidateY + Math.max(candidateLines.length, dateLines.length) * 4 + 3;
      const metadataHeight = roleY + roleLines.length * 4 + 3;
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      ensureSpace(metadataHeight + 8);
      doc.roundedRect(left, y, contentWidth, metadataHeight, 3, 3, "FD");
      doc.setTextColor(30, 64, 175);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("SESSION", left + 5, y + 7);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text(titleLines, left + 5, y + titleY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(candidateLines, left + 5, y + candidateY);
      doc.text(dateLines, left + contentWidth / 2, y + candidateY);
      doc.text(roleLines, left + 5, y + roleY);
      y += metadataHeight + 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${data.notes.length} question${data.notes.length === 1 ? "" : "s"} reviewed · Study notes and suggested answer points`,
        left,
        y,
      );
      y += 10;

      data.notes.forEach((note: any, index: number) => {
        ensureSpace(22);
        if (index > 0) {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.35);
          doc.line(left, y, right, y);
          y += 8;
        }

        const question = typeof note.question === "string" ? note.question.trim().slice(0, 3000) : "";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        const questionLines = doc.splitTextToSize(`Q${index + 1}. ${question || "Interview question"}`, contentWidth) as string[];
        questionLines.forEach((line) => {
          ensureSpace(8);
          doc.text(line, left, y);
          y += 5.5;
        });
        y += 3;

        addSectionHeading("Your answer", [100, 116, 139]);
        addParagraph(
          typeof note.candidate_answer === "string" ? note.candidate_answer : "",
          { fontSize: 9.5, color: [71, 85, 105], fontStyle: "italic", indent: 2, gap: 3 },
        );

        if (Array.isArray(note.key_points) && note.key_points.length > 0) {
          addSectionHeading("Key points to remember", [37, 99, 235]);
          note.key_points.forEach((point: unknown) => {
            if (typeof point === "string" && point.trim()) {
              addParagraph(`- ${point.trim()}`, {
                fontSize: 9.5,
                color: [51, 65, 85],
                indent: 3,
                gap: 1,
              });
            }
          });
          y += 2;
        }

        if (typeof note.suggested_answer_summary === "string" && note.suggested_answer_summary.trim()) {
          ensureSpace(15);
          doc.setFillColor(240, 253, 250);
          doc.setDrawColor(153, 246, 228);
          addSectionHeading("Strong answer should include", [13, 148, 136]);
          addParagraph(note.suggested_answer_summary.slice(0, 3000), {
            fontSize: 9.5,
            color: [19, 78, 74],
            indent: 3,
            gap: 8,
          });
        }
      });

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(left, pageHeight - 13, right, pageHeight - 13);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Personal interview study notes · Review and adapt to your own experience", left, pageHeight - 8);
        doc.text(`${page} / ${pageCount}`, right, pageHeight - 8, { align: "right" });
      }

      doc.save(`Interview_Notes_${interview.id || interview.documentId}.pdf`);
      toast.dismiss(toastId);
      toast.success("Notes downloaded as PDF!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to generate notes. Please try again.");
    } finally {
      setIsGeneratingNotes(null);
    }
  };

  const interviews: any[] = data?.data || [];

  if (isLoading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#020617]">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Analyzing Reports...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-[#020617] text-rose-400 font-bold p-10 text-center">
        <div className="glass-card p-8 rounded-3xl border-rose-500/20 max-w-md">
          Failed to load reports. Please refresh the page to try again.
        </div>
      </div>
    );

  return (
    <main className="relative min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-3 py-20 sm:px-6 sm:py-28 md:py-40">
        <header className="mb-10 text-center sm:mb-16 md:mb-20">
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Review Your Journey</span>
          </motion.div> */}
          <h1 className="mb-4 text-4xl font-black tracking-tighter text-white sm:mb-6 sm:text-5xl md:text-7xl">
            Interview <span className="text-gradient">Insights</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
            Every session is a step toward perfection. Analyze your performance data
            and technical depth through AI-conducted session reports.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {interviews.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl border-white/5 px-4 py-20 text-center sm:rounded-[3rem] sm:px-8 sm:py-32"
            >
              <FileText className="h-16 w-16 text-slate-600 mx-auto mb-6 opacity-20" />
              <p className="text-base font-medium text-slate-400 sm:text-xl">No experience reports found yet.</p>
              <Button onClick={() => router.push('/create-interview')} className="mt-8 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold px-8">
                Conduct Your First Session
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {interviews.map((interview, idx) => {
                const report = parseInterviewReport(interview.report);
                const transcriptReady = hasEnoughTranscript(interview.conversation);
                return (
                  <motion.div
                    key={interview.id || idx}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="group"
                  >
                  <div className="glass-card flex h-full min-w-0 flex-col justify-between rounded-3xl border-white/5 p-5 transition-all hover:bg-white/[0.03] group-hover:border-blue-500/20 sm:rounded-[2.5rem] sm:p-7 lg:p-8">
                    <div className="relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl bg-${interview.difficulty === 'hard' ? 'rose' : interview.difficulty === 'medium' ? 'amber' : 'emerald'}-500/10 text-${interview.difficulty === 'hard' ? 'rose' : interview.difficulty === 'medium' ? 'amber' : 'emerald'}-400`}>
                          <Target className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                          {interview.mode || 'Technical'}
                        </span>
                      </div>

                      <h2 className="mb-4 line-clamp-2 break-words text-xl font-extrabold leading-tight text-white transition-colors group-hover:text-blue-400 sm:text-2xl">
                        {interview.details || "Untitled Session"}
                      </h2>

                      <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                          <Layers className="h-4 w-4 text-blue-500/50" />
                          <span className="text-wrap break-words overflow-hidden">Skills: {interview.skills || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                          <Calendar className="h-4 w-4 text-purple-500/50" />
                          <span>{new Date(interview.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {report && transcriptReady && (
                        <Button
                          className="h-12 rounded-2xl bg-white text-black hover:bg-slate-100 font-bold w-full transition-all group/btn"
                          onClick={() => setSelectedReport(report)}
                        >
                          View Report
                          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                      {report && transcriptReady && (
                        <Button
                          onClick={() => handleGenerateNotes(interview)}
                          disabled={isGeneratingNotes === (interview.id || interview.documentId)}
                          className="h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 hover:text-indigo-300 font-bold w-full transition-all"
                        >
                          {isGeneratingNotes === (interview.id || interview.documentId) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <DownloadCloud className="mr-2 h-4 w-4" />
                          )}
                          {isGeneratingNotes === (interview.id || interview.documentId) ? "Analysing conversation..." : "Improvements"}
                        </Button>
                      )}
                      {!report && (
                        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200/80">
                          Report and improvements are unavailable because this session has no generated report.
                        </p>
                      )}
                      {report && !transcriptReady && (
                        <p className="rounded-xl border border-slate-500/20 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-slate-400">
                          Complete at least two interview questions and answers to unlock the report and Improvements.
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        className="h-12 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold w-full"
                        onClick={() => router.push(`/interview/${interview.documentId}`)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake Session
                      </Button>
                    </div>
                  </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* REPORT MODAL */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => {
        if (!open) setSelectedReport(null);
      }}>
        <DialogContent className="h-[96dvh] max-h-[96dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border-white/10 bg-slate-950 p-0 text-slate-200 shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[95vw] sm:max-w-[95vw] sm:rounded-3xl lg:max-w-7xl lg:rounded-[3rem]">
          <div className="flex flex-col h-full overflow-hidden">
            <header className="flex shrink-0 items-center justify-between border-b border-white/5 bg-white/[0.01] px-4 py-3 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  Session <span className="text-blue-500 italic">Report</span>
                </DialogTitle>
                {/* <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Generated by NeuraView AI Engine</p> */}
              </div>
              {/* <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedReport(null)}
                    className="rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all h-10 w-10"
                  >
                    <X className="h-5 w-5" />
                  </Button> */}
            </header>

            <div className="flex-grow overflow-y-auto custom-scrollbar bg-white/[0.01]">
              {selectedReport ? (
                <InterviewReport report={selectedReport} />
              ) : (
                <div className="flex items-center justify-center h-full p-20">
                  <div className="text-center">
                    <RotateCcw className="h-10 w-10 text-slate-700 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-500 font-medium italic">Preparing your analysis...</p>
                  </div>
                </div>
              )}
            </div>

            <footer className="flex shrink-0 justify-end border-t border-white/5 bg-white/[0.01] px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-6">
              <Button
                onClick={() => setSelectedReport(null)}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 font-bold text-white transition-all hover:bg-white/10 sm:h-12 sm:rounded-2xl sm:px-8"
              >
                Exit Analysis
              </Button>
            </footer>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center h-screen bg-[#020617]">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Initializing Reports...</p>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
