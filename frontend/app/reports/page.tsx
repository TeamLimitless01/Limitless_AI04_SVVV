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

function ReportsContent() {
  const { data: user } = useSession<any>();
  const router = useRouter();
  const { data, error, isLoading } = useStrapi("interviews", {
    filters: { user: user?.user?.id },
    sort: ["createdAt:desc"],
  });

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");
  const hasAutoOpened = useRef(false);

  useEffect(() => {
    if (interviewId && data?.data?.length > 0 && !hasAutoOpened.current) {
      const interview = data.data.find(
        (i: any) => i.documentId === interviewId || i.id?.toString() === interviewId
      );
      if (interview && interview.report) {
        try {
          const parsed = typeof interview.report === "string" ? JSON.parse(interview.report) : interview.report;
          setSelectedReport(parsed);
          hasAutoOpened.current = true;
        } catch (e) {
          console.error("Invalid report format", e);
        }
      }
    }
  }, [interviewId, data]);

  const handleGenerateNotes = async (interview: any) => {
    setIsGeneratingNotes(interview.id || interview.documentId);
    try {
      if (!interview.conversation || interview.conversation.length === 0) {
        toast.error("No conversation logs found for this interview.");
        return;
      }
      
      const toastId = toast.loading("AI is generating notes...");
      
      const response = await fetch("/api/interview/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: interview.conversation?.map((c:any) => c.content),
          interviewDetails: {
            topic: interview.details,
            skills: interview.skills,
            mode: interview.mode || 'Technical'
          }
        }),
      });
      
      if (!response.ok) throw new Error("API failed");
      const data = await response.json();
      
      const candidateName = interview?.candidateName || "Candidate";

      const doc = new jsPDF();
      let y = 30;

      // Header strip (Branding)
      doc.setFillColor(30, 64, 175); // Dark blue theme
      doc.rect(0, 0, 210, 40, 'F');
      
      // Branding text (White)
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("NeuraView", 15, 24);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("AI Interview Intelligence", 15, 32);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "italic");
      doc.text("", 195, 24, { align: "right" });

      y = 55;
      
      // Info box for Candidate
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, y, 180, 30, 'FD');
      
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.text(`Candidate:`, 20, y + 9);
      doc.setFont("helvetica", "normal");
      doc.text(candidateName, 45, y + 9);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Role:`, 20, y + 18);
      doc.setFont("helvetica", "normal");
      doc.text(interview.details || "Untitled Assessment", 45, y + 18);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Skills Focus:`, 20, y + 27);
      doc.setFont("helvetica", "normal");
      doc.text(interview.skills || "N/A", 45, y + 27);
      
      y += 45;
      doc.setTextColor(30, 30, 30);
      
      if (data.notes && Array.isArray(data.notes)) {
        data.notes.forEach((note: any, index: number) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          const questionLines = doc.splitTextToSize(`Q${index + 1}: ${note.question}`, 180);
          doc.text(questionLines, 15, y);
          y += (questionLines.length * 7) + 6;

          doc.setFontSize(12);

          if (note.candidate_answer) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("Your Answer:", 15, y);
            y += 6;
            doc.setFont("helvetica", "italic");
            doc.setTextColor(90, 90, 90);
            const userAnsLines = doc.splitTextToSize(note.candidate_answer, 180);
            doc.text(userAnsLines, 15, y);
            y += (userAnsLines.length * 6) + 8;
            if (y > 270) { doc.addPage(); y = 20; }
          }
          
          doc.setTextColor(30, 30, 30);
          doc.setFont("helvetica", "normal");
          if (note.key_points && note.key_points.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Key Points:", 15, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            note.key_points.forEach((point: string) => {
              if (y > 275) { doc.addPage(); y = 20; }
              const pointLines = doc.splitTextToSize(`• ${point}`, 170);
              doc.text(pointLines, 20, y);
              y += (pointLines.length * 6);
            });
            y += 5;
          }
          
          if (note.suggested_answer_summary) {
            if (y > 265) { doc.addPage(); y = 20; }
            doc.setFont("helvetica", "bold");
            doc.text("Ideal Answer Summary:", 15, y);
            y += 6;
            doc.setFont("helvetica", "italic");
            const answerLines = doc.splitTextToSize(note.suggested_answer_summary, 180);
            doc.text(answerLines, 15, y);
            y += (answerLines.length * 6) + 15;
          }
        });
      } else {
        doc.setFontSize(12);
        doc.text("No questions detected or could not extract notes.", 15, y);
      }
      
      doc.save(`Interview_Notes_${interview.id || interview.documentId}.pdf`);
      toast.dismiss(toastId);
      toast.success("Notes downloaded as PDF!");
    } catch(err) {
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 md:py-40">
        <header className="mb-20 text-center">
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Review Your Journey</span>
          </motion.div> */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Interview <span className="text-gradient">Insights</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
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
              className="text-center py-32 glass-card rounded-[3rem] border-white/5"
            >
              <FileText className="h-16 w-16 text-slate-600 mx-auto mb-6 opacity-20" />
              <p className="text-slate-400 text-xl font-medium">No experience reports found yet.</p>
              <Button onClick={() => router.push('/create-interview')} className="mt-8 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold px-8">
                Conduct Your First Session
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {interviews.map((interview, idx) => (
                <motion.div
                  key={interview.id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <div className="glass-card h-full rounded-[2.5rem] border-white/5 p-8 flex flex-col justify-between transition-all hover:bg-white/[0.03] group-hover:border-blue-500/20">
                    <div className="relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl bg-${interview.difficulty === 'hard' ? 'rose' : interview.difficulty === 'medium' ? 'amber' : 'emerald'}-500/10 text-${interview.difficulty === 'hard' ? 'rose' : interview.difficulty === 'medium' ? 'amber' : 'emerald'}-400`}>
                          <Target className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                          {interview.mode || 'Technical'}
                        </span>
                      </div>
                      
                      <h2 className="text-2xl font-extrabold text-white mb-4 line-clamp-1 leading-tight group-hover:text-blue-400 transition-colors">
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
                      <Button
                        className="h-12 rounded-2xl bg-white text-black hover:bg-slate-100 font-bold w-full transition-all group/btn"
                        onClick={() => {
                          try {
                            const parsed = typeof interview.report === "string" ? JSON.parse(interview.report) : interview.report;
                            setSelectedReport(parsed);
                          } catch (e) {
                            alert("Invalid report format");
                          }
                        }}
                      >
                        View Report
                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
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
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* REPORT MODAL */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-7xl h-[95vh] md:h-[90vh] bg-slate-950 text-slate-200 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden p-0 backdrop-blur-3xl">
          <div className="flex flex-col h-full overflow-hidden">
            <header className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-2xl font-black text-white tracking-tight">
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

            <footer className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-end shrink-0">
              <Button
                onClick={() => setSelectedReport(null)}
                className="h-12 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold transition-all"
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
