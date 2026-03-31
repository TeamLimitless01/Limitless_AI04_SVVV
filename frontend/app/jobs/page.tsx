"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, Briefcase, MapPin, DollarSign, XCircle, Search, FileText, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";

export default function CareerJobsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const handleUploadAndExtract = async () => {
    if (!file) {
      toast.error("Please upload a resume first.");
      return;
    }
    
    setIsExtracting(true);
    const loadingToast = toast.loading("Analyzing resume...");

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
      toast.success("Skills extracted from document natively!", { id: loadingToast });
      
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
    const loadingToast = toast.loading("Searching relevant matches...");
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: searchSkills }),
      });

      if (!res.ok) throw new Error("Job search API failed");
      const data = await res.json();
      setJobs(data.jobs || []);
      toast.success(`Found ${data.jobs?.length || 0} top global matches!`, { id: loadingToast });
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to query Adzuna jobs database.", { id: loadingToast });
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
      
      {/* Background aesthetics */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        <header className="mb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Career Hub</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Upload your resume and let our deep AI stack extract your core competencies, instantly matching you with global roles on Adzuna.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Upload Section - 4 Columns */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-card rounded-[2rem] p-8 border border-white/10 hover:border-indigo-500/30 transition-all bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" /> AI Resume Scanner
              </h2>

              <label 
                className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${file ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
              >
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                
                {file ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-indigo-400 mb-4" />
                    <span className="text-white font-bold">{file.name}</span>
                    <span className="text-sm text-slate-400 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-slate-500 mb-4" />
                    <span className="text-slate-300 font-bold">Drop PDF Resume</span>
                    <span className="text-sm text-slate-500 mt-2">Maximum file size: 5MB</span>
                  </>
                )}
              </label>

              <button
                disabled={isExtracting || !file}
                onClick={handleUploadAndExtract}
                className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold tracking-wide hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
              >
                {isExtracting ? "Processing..." : "Ananlyse"}
              </button>
            </div>

            {/* Extracted Skills */}
            {skills.length > 0 && (
              <div className="glass-card rounded-[2rem] p-8 border border-white/10 bg-white/[0.02] shadow-2xl">
                 <h2 className="text-sm uppercase tracking-widest font-bold text-slate-500 mb-4 flex items-center justify-between">
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
                 <button
                    onClick={handleRefetchJobs}
                    disabled={isSearchingJobs}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold transition-all"
                  >
                    <Search className="w-4 h-4" /> Refresh Job Query
                 </button>
              </div>
            )}
          </div>

          {/* Job Results Section - 8 Columns */}
          <div className="lg:col-span-8">
            <div className="glass-card h-full rounded-[2rem] p-8 border border-white/10 bg-slate-950/40 backdrop-blur-md">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Briefcase className="w-6 h-6 text-cyan-400" /> 
                  Job Market Matches {jobs.length > 0 && `(${jobs.length})`}
                </h2>
                {isSearchingJobs && (
                  <div className="flex items-center gap-2 text-indigo-400 font-medium animate-pulse text-sm">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" /> Fetching real-time listings...
                  </div>
                )}
              </div>

              {jobs.length === 0 && !isSearchingJobs && (
                 <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                    <Briefcase className="w-16 h-16 text-slate-500 mb-4" />
                    <p className="text-xl font-bold text-slate-400">Waiting for skill insights</p>
                    <p className="text-slate-500">Upload your resume to activate automated targeted job search via Adzuna</p>
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <a 
                    key={job.id} 
                    href={job.redirect_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all cursor-pointer"
                  >
                    <div className="mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md mb-3 inline-block">
                        {job.category?.label || "General"}
                        </span>
                        <h3 className="text-lg font-bold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                            {job.title}
                        </h3>
                        <p className="text-sm font-semibold text-slate-400 mt-1">{job.company?.display_name}</p>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                        {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-auto pt-4 border-t border-white/5 text-xs font-semibold text-slate-400">
                        {job.location?.display_name && (
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {job.location.display_name}</span>
                        )}
                        {(job.salary_min || job.salary_max) && (
                            <span className="flex items-center gap-1.5 text-emerald-400"><IndianRupee className="w-3.5 h-3.5" /> 
                            {job.salary_min ? `$${job.salary_min}` : ''} {job.salary_max ? `- $${job.salary_max}` : ''}
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
