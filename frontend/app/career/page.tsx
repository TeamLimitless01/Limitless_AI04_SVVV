"use client";

import { useState } from "react";
import { 
  UploadCloud, 
  CheckCircle2, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  XCircle, 
  Search, 
  FileText, 
  IndianRupee,
  ChevronLeft,
  Sparkles,
  Info,
  X,
  Target
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function CareerHubPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  
  // AI Insights State
  const [summary, setSummary] = useState("");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [showAIInsights, setShowAIInsights] = useState(false);

  const handleUploadAndExtract = async () => {
    if (!file) {
      toast.error("Please upload a resume first.");
      return;
    }
    
    setIsExtracting(true);
    const loadingToast = toast.loading("Analyzing resume with AI...");

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/resume/extract-skills", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Resume parse pipeline failed");

      const data = await res.json();
      setSkills(data.skills);
      setSummary(data.summary);
      setImprovements(data.improvements);
      
      toast.success("Skills & analysis completed successfully!", { id: loadingToast });
      
      // Auto trigger job search with the extracted skills
      fetchJobs(data.skills);

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to extract data: " + error.message, { id: loadingToast });
    } finally {
      setIsExtracting(false);
    }
  };

  const fetchJobs = async (searchSkills: string[]) => {
    setIsSearchingJobs(true);
    const loadingToast = toast.loading("Searching for global matches...");
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: searchSkills }),
      });

      if (!res.ok) throw new Error("Job search API failed");
      const data = await res.json();
      setJobs(data.jobs || []);
      toast.success(`Found ${data.jobs?.length || 0} matching roles!`, { id: loadingToast });
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to query jobs database.", { id: loadingToast });
    } finally {
      setIsSearchingJobs(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = skills.filter(s => s !== skillToRemove);
    setSkills(updated);
  };

  const handleRefetchJobs = () => {
    if (skills.length > 0) {
      fetchJobs(skills);
    } else {
      toast.error("Please ensure you have at least 1 skill tag");
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto selection:bg-indigo-500/30">
      
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] bg-cyan-500/10 dark:bg-cyan-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* AI Insights Modal */}
      <AnimatePresence>
        {showAIInsights && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIInsights(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md max-h-[85vh] bg-slate-900/95 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Decorative gradient */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full pointer-events-none" />
              
              <button 
                onClick={() => setShowAIInsights(false)}
                className="absolute top-5 right-5 z-20 p-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">AI Evaluation</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Summary Section */}
                    <section>
                      <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Info className="w-3.5 h-3.5" /> Professional Summary
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed italic">
                        "{summary}"
                      </p>
                    </section>

                    {/* Improvements Section */}
                    <section>
                      <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Target className="w-3.5 h-3.5" /> Suggestions
                      </h3>
                      <div className="space-y-3">
                        {improvements.map((imp, idx) => (
                          <div key={idx} className="flex gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 items-start">
                            <div className="mt-0.5 w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-slate-300 text-sm font-medium leading-normal">{imp}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <Button 
                    onClick={() => setShowAIInsights(false)}
                    className="mt-10 w-full h-11 rounded-xl bg-white text-black font-bold hover:bg-slate-100 shadow-xl text-sm"
                  >
                    Got it, Thanks!
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <Button 
          variant="ghost" 
          asChild
          className="mb-12 text-slate-400 hover:text-white flex items-center gap-2 group w-fit"
        >
          <Link href="/roadmap-chat">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Services
          </Link>
        </Button>

        <header className="mb-20">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Career Hub</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-3xl leading-relaxed">
            Upload your resume and let our deep AI stack extract your core competencies, instantly matching you with global roles.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Upload Section */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="glass-card rounded-[3rem] p-8 border border-white/10 bg-slate-900/40 backdrop-blur-3xl">
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" /> AI Resume Scanner
              </h2>

              <label 
                className={`flex flex-col items-center justify-center p-10 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer ${file ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                
                {file ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-indigo-400 mb-4" />
                    <span className="text-white font-bold text-center break-all px-4">{file.name}</span>
                    <span className="text-sm text-slate-400 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-16 h-16 text-slate-500 mb-4" />
                    <span className="text-slate-300 font-bold">Drop PDF Resume</span>
                    <span className="text-sm text-slate-500 mt-2">Maximum file size: 5MB</span>
                  </>
                )}
              </label>

              <Button
                disabled={isExtracting || !file}
                onClick={handleUploadAndExtract}
                className="mt-8 w-full h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold tracking-wide hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/25"
              >
                {isExtracting ? "Analysing Document..." : "Analyse Resume"}
              </Button>
            </div>

            {/* Extracted Insights */}
            {skills.length > 0 && (
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => setShowAIInsights(true)}
                  className="w-full h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-black tracking-tight hover:bg-indigo-500/20 shadow-2xl transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-6 h-6" /> Interview Improvements & Summary
                </Button>

                <div className="glass-card rounded-[3rem] p-8 border border-white/10 bg-slate-900/40 backdrop-blur-3xl shadow-2xl">
                   <h2 className="text-sm uppercase tracking-widest font-bold text-slate-500 mb-6 flex items-center justify-between">
                     Extracted Skills <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{skills.length}</span>
                   </h2>
                   <div className="flex flex-wrap gap-2">
                     {skills.map((skill, idx) => (
                       <span key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-sm font-medium text-slate-200">
                         {skill}
                         <button onClick={() => handleRemoveSkill(skill)} className="hover:text-rose-400 transition-colors">
                           <XCircle className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                         </button>
                       </span>
                     ))}
                   </div>
                   <Button
                      onClick={handleRefetchJobs}
                      disabled={isSearchingJobs}
                      variant="outline"
                      className="mt-8 w-full h-12 rounded-xl border-white/10 hover:bg-white/5 font-bold"
                    >
                      <Search className="w-4 h-4 mr-2" /> Refresh Job Match
                   </Button>
                </div>
              </div>
            )}
          </div>

          {/* Job Results Section */}
          <div className="lg:col-span-8">
            <div className="glass-card min-h-[600px] h-full rounded-[3rem] p-8 md:p-12 border border-white/10 bg-slate-900/40 backdrop-blur-3xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-cyan-400" /> 
                  Global Matches {jobs.length > 0 && `(${jobs.length})`}
                </h2>
                {isSearchingJobs && (
                  <div className="flex items-center gap-2 text-indigo-400 font-medium animate-pulse text-sm">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" /> Fetching real-time listings...
                  </div>
                )}
              </div>

              {jobs.length === 0 && !isSearchingJobs && (
                 <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                    <Briefcase className="w-20 h-20 text-slate-500 mb-6" />
                    <p className="text-2xl font-bold text-slate-400 mb-2">Waiting for skill insights</p>
                    <p className="text-slate-500 max-w-sm mx-auto">Upload your resume to activate automated targeted job search via Adzuna</p>
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job) => (
                  <a 
                    key={job.id} 
                    href={job.redirect_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block p-6 rounded-[2rem] border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all cursor-pointer"
                  >
                    <div className="mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md mb-4 inline-block">
                        {job.category?.label || "General"}
                        </span>
                        <h3 className="text-xl font-bold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-tight">
                            {job.title}
                        </h3>
                        <p className="text-sm font-semibold text-slate-400 mt-2">{job.company?.display_name}</p>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                        {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-5 mt-auto pt-5 border-t border-white/5 text-xs font-semibold text-slate-400">
                        {job.location?.display_name && (
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location.display_name}</span>
                        )}
                        {(job.salary_min || job.salary_max) && (
                            <span className="flex items-center gap-1.5 text-emerald-400"><IndianRupee className="w-4 h-4" /> 
                            {job.salary_min ? `${job.salary_min}` : ''} {job.salary_max ? `- ${job.salary_max}` : ''}
                            </span>
                        )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
