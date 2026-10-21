"use client";
import {
  User,
  MapPin,
  FileText,
  Settings2,
  Target,
  Timer,
  LayoutDashboard,
  Brain,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
  ChevronLeft,
  ArrowRight,
  Globe,
  Zap,
  Search,
  Plus,
  X,
} from "lucide-react";
import Orb from "@/components/Orb";
import TrueFocus from "@/components/TrueFocus";
import Stepper, { Step } from "@/components/ui/stepper";
import { strapi } from "@/lib/api/sdk";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import React, { useState } from "react";
import toast from "react-hot-toast";

function Page() {
  const [candidateName, setCandidateName] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [mode, setMode] = useState("Technical");
  const [difficulty, setDifficulty] = useState("medium");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [topic, setTopic] = useState("");
  const [interviewTime, setInterviewTime] = useState("15");
  const [interviewLanguage, setInterviewLanguage] = useState("english");
  const [aiSummary, setAiSummary] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const router = useRouter();
  const { data } = useSession<any>();
  const [loading, setLoading] = useState(false);

  const addSkills = (value: string) => {
    const newSkills = value
      .split(/[,\n]/)
      .map((skill) => skill.trim())
      .filter(Boolean);
    if (!newSkills.length) return;
    setSkills((current) => {
      const known = new Set(current.map((skill) => skill.toLocaleLowerCase()));
      return [
        ...current,
        ...newSkills.filter((skill) => {
          const normalized = skill.toLocaleLowerCase();
          if (known.has(normalized)) return false;
          known.add(normalized);
          return true;
        }),
      ];
    });
    setSkillInput("");
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResume(file);
    setAiSummary("");
    setIsExtracting(true);
    const loadingToast = toast.loading(
      "AI is analyzing your resume profile...",
    );

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/resume/extract-skills", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to extract data");

      const extraction = await res.json();

      // Autofill logic
      if (extraction.candidateName) setCandidateName(extraction.candidateName);
      if (extraction.jobRole) setTopic(extraction.jobRole);
      if (Array.isArray(extraction.skills)) {
        setSkills(
          extraction.skills.filter(
            (skill: unknown): skill is string => typeof skill === "string",
          ),
        );
      }
      if (extraction.suggestedDifficulty)
        setDifficulty(extraction.suggestedDifficulty.toLowerCase());
      if (extraction.suggestedMode) setMode(extraction.suggestedMode);
      if (extraction.summary) setAiSummary(extraction.summary);

      toast.success("Profile generated from resume!", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("Cloud extraction failed, but you can fill manually.", {
        id: loadingToast,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmitFinal = async () => {
    try {
      setLoading(true);
      if (!skills.length || !topic.trim()) {
        return toast.error("Please provide skills and job role");
      }

      if (!data || !data.user) {
        return toast.error("You must be logged in to create an interview");
      }

      const res = await strapi.create("interviews", {
        resume: aiSummary,
        mode: mode,
        difficulty: difficulty,
        skills: skills.join(", "),
        details: topic.trim(),
        interviewTime: parseInt(interviewTime),
        user: data.user.id,
        candidateName: candidateName || "Candidate",
        interviewLanguage: interviewLanguage,
      });

      toast.success("Interview session ready!");
      router.push(`/interview/${res.data.documentId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize session.");
    } finally {
      setLoading(false);
    }
  };

  const InputClasses =
    "p-3.5 w-full bg-slate-900 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none placeholder:text-slate-500 text-sm";
  const SelectClasses = `${InputClasses} cursor-pointer`;
  const LabelClasses =
    "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1";
  const CardClasses =
    "glass-card p-5 sm:p-6 md:p-8 border-white/5 rounded-2xl sm:rounded-[2rem] bg-slate-900/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden";
  const assessmentCriteria =
    mode === "HR"
      ? [
          {
            label: "Behavioral evidence and relevance",
            weight: 40,
            description:
              "Specific, relevant examples and the candidate's own actions.",
          },
          {
            label: "Judgment, reflection, and actions",
            weight: 35,
            description:
              "Reasoning, accountability, learning, and choices in the example.",
          },
          {
            label: "Communication and clarity",
            weight: 25,
            description: "Clear, organized, and specific answers.",
          },
        ]
      : [
          {
            label: "Technical knowledge and application",
            weight: 40,
            description:
              "Correctness and relevance of role-specific knowledge.",
          },
          {
            label: "Technical reasoning and tradeoffs",
            weight: 35,
            description:
              "Reasoning, constraints, and support for technical decisions.",
          },
          {
            label: "Communication and clarity",
            weight: 25,
            description: "Clear, organized, and specific answers.",
          },
        ];

  return (
    <main className="min-h-screen bg-transparent selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 min-h-[90vh] flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col gap-12 items-center justify-center min-h-[60vh]">
            <TrueFocus
              sentence="Preparing Your Session"
              manualMode={false}
              blurAmount={10}
              borderColor="blue"
              animationDuration={2}
              pauseBetweenAnimations={0.5}
            />
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-slate-400 font-medium tracking-widest text-xs uppercase"
            >
              Tuning AI Recruiter Constraints...
            </motion.div>
          </div>
        ) : (
          <Stepper
            initialStep={1}
            onFinalStepCompleted={handleSubmitFinal}
            backButtonText="Back"
            nextButtonText="Continue"
            stepCircleContainerClassName="!max-w-5xl !rounded-2xl sm:!rounded-[2.5rem]"
            stepContainerClassName="!p-4 sm:!p-8"
            contentClassName="!px-4 sm:!px-8"
            footerClassName="!px-4 sm:!px-8 !pb-6 sm:!pb-8"
          >
            {/* Step 1: Welcome */}
            <Step>
              <div className={CardClasses}>
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Brain className="w-48 h-48" />
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
                    Custom <span className="text-blue-500">Practice</span> Setup
                  </h2>
                </div>
                <p className="text-slate-400 text-base sm:text-lg md:text-xl leading-relaxed mb-8 sm:mb-10">
                  Welcome! We're about to build a high-fidelity mock interview
                  tailored strictly to your profile. Provide your details
                  manually or upload a resume to let our AI do the hard work for
                  you.
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    // { icon: ShieldCheck, text: "FAANG Aligned" },
                    { icon: Globe, text: "Multilingual Support" },
                    { icon: Zap, text: "Instant Analysis" },
                  ].map((inf, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-xs font-bold text-slate-500 flex items-center gap-2"
                    >
                      <inf.icon className="w-3.5 h-3.5" /> {inf.text}
                    </div>
                  ))}
                </div>
              </div>
            </Step>

            {/* Step 2: Core Details & Resume */}
            <Step>
              <div className={CardClasses}>
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <User className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Core Setup
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 sm:mb-10">
                  <div className="space-y-6">
                    <div>
                      <label className={LabelClasses}>Candidate Name</label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="John Doe"
                        className={InputClasses}
                      />
                    </div>
                    <div>
                      <label className={LabelClasses}>Language Target</label>
                      <select
                        value={interviewLanguage}
                        onChange={(e) => setInterviewLanguage(e.target.value)}
                        className={SelectClasses}
                      >
                        <option value="english">
                          English (Global Standard)
                        </option>
                        <option value="hindi">Hindi (Regional)</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className={LabelClasses}>
                      Fill Automatically with resume
                    </label>
                    <label
                      className={`flex flex-col items-center justify-center p-5 sm:p-8 min-h-[162px] rounded-2xl border-2 border-dashed transition-all cursor-pointer ${resume ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 hover:border-white/30 bg-white/5"}`}
                    >
                      <input
                        type="file"
                        onChange={handleResumeUpload}
                        accept=".pdf"
                        className="hidden"
                      />
                      {isExtracting ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                          <span className="text-xs font-bold text-blue-400">
                            Scanning Resume...
                          </span>
                        </div>
                      ) : resume ? (
                        <div className="text-center">
                          <CheckCircle2 className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                          <p className="text-xs font-bold text-white max-w-[150px] truncate">
                            {resume.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">
                            Used for interview context
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                          <p className="text-xs font-bold text-slate-400">
                            Upload PDF Resume
                          </p>
                          <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest italic">
                            Optional but Recommended
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className={LabelClasses}>Interview Target</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className={SelectClasses}
                    >
                      <option value="Technical">Technical Proficiency</option>
                      <option value="HR">HR / Leadership Behavior</option>
                    </select>
                  </div>
                  <div>
                    <label className={LabelClasses}>Expected Challenge</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className={SelectClasses}
                    >
                      <option value="easy">Easy (Fundamentals)</option>
                      <option value="medium">Medium (Professional)</option>
                      <option value="hard">Hard (Senior/Lead)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 3: Focus & Role */}
            <Step>
              <div className={CardClasses}>
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Target className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Focused On
                  </h2>
                </div>

                <div className="space-y-10">
                  <div>
                    <label className={LabelClasses}>Target Job Role</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Senior Frontend Architect"
                      className={InputClasses}
                    />
                    <p className="text-[10px] text-slate-600 mt-3 ml-1 uppercase tracking-widest italic">
                      The AI will generate questions specific to this role.
                    </p>
                  </div>

                  <div>
                    <label className={LabelClasses}>
                      Focus areas / competencies
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addSkills(skillInput);
                          }
                        }}
                        placeholder={
                          mode === "HR"
                            ? "e.g. teamwork, conflict resolution"
                            : "e.g. React, system design"
                        }
                        className={InputClasses}
                        aria-label="Add a focus area or competency"
                      />
                      <button
                        type="button"
                        onClick={() => addSkills(skillInput)}
                        disabled={!skillInput.trim()}
                        className="min-h-11 shrink-0 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Plus className="h-4 w-4" /> Add
                        </span>
                      </button>
                    </div>
                    {skills.length > 0 && (
                      <ul
                        className="mt-4 flex flex-wrap gap-2"
                        aria-label="Selected focus areas"
                      >
                        {skills.map((skill) => (
                          <li
                            key={skill}
                            className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 py-1.5 pl-3 pr-1.5 text-sm text-blue-100"
                          >
                            <span className="break-all">{skill}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setSkills((current) =>
                                  current.filter((item) => item !== skill),
                                )
                              }
                              aria-label={`Remove ${skill}`}
                              className="rounded-full p-1 text-blue-200/70 hover:bg-white/10 hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-slate-500 mt-3 ml-1">
                      Add skills or competencies one at a time. They guide
                      questions and report coverage.
                    </p>
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 4: Duration */}
            <Step>
              <div className={CardClasses}>
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Timer className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Session Length
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { val: "2", label: "Demo", sub: "2 Min" },
                    { val: "5", label: "Quick", sub: "5 Min" },
                    { val: "15", label: "Standard", sub: "15 Min" },
                    // { val: "30", label: "Deep", sub: "30 Min" },
                    // { val: "45", label: "Expert", sub: "45 Min" },
                    // { val: "60", label: "Elite", sub: "60 Min" },
                  ].map((time) => (
                    <button
                      key={time.val}
                      type="button"
                      onClick={() => setInterviewTime(time.val)}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${interviewTime === time.val ? "border-emerald-500 bg-emerald-500/10" : "border-white/5 bg-white/5 hover:border-white/20"}`}
                    >
                      <p
                        className={`font-black text-lg ${interviewTime === time.val ? "text-white" : "text-slate-400"}`}
                      >
                        {time.label}
                      </p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-widest">
                        {time.sub}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </Step>

            {/* Final Step */}
            <Step>
              <div className={CardClasses}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                    Review & begin
                  </h2>
                </div>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
                  Review your setup before starting. Your resume summary can
                  help tailor interview questions, but it is not used as
                  evidence when scoring your answers.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-300">
                      Interview setup
                    </h3>
                    <dl className="mt-4 space-y-3 text-sm">
                      {[
                        ["Candidate", candidateName.trim() || "Candidate"],
                        ["Role", topic.trim() || "Not provided"],
                        [
                          "Type",
                          mode === "HR" ? "HR / behavioral" : "Technical",
                        ],
                        ["Difficulty", difficulty],
                        ["Language", interviewLanguage],
                        ["Duration", `${interviewTime} minutes`],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4"
                        >
                          <dt className="shrink-0 text-slate-500">{label}</dt>
                          <dd className="break-words text-white sm:text-right">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 border-t border-white/5 pt-4">
                      <p className="text-xs text-slate-500">Focus areas</p>
                      <p className="mt-1 break-words text-sm text-white">
                        {skills.length
                          ? skills.join(", ")
                          : "Add at least one focus area"}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.03] p-4 sm:p-5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-300">
                      Report rubric · 0–4 ratings
                    </h3>
                    <ul className="mt-4 space-y-4">
                      {assessmentCriteria.map((criterion) => (
                        <li key={criterion.label}>
                          <div className="flex items-start justify-between gap-3 text-sm">
                            <span className="font-semibold text-slate-200">
                              {criterion.label}
                            </span>
                            <span className="shrink-0 text-emerald-200">
                              {criterion.weight}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">
                            {criterion.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 border-t border-white/5 pt-3 text-xs leading-relaxed text-slate-500">
                      Ratings use exact excerpts from your answers. A metric
                      without enough answer evidence is marked “Not assessed”;
                      resume details and camera presence do not affect scores.
                    </p>
                  </div>
                </div>
                {aiSummary && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Resume summary used for context
                    </h3>
                    <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-400">
                      {aiSummary}
                    </p>
                  </div>
                )}
                {resume && !aiSummary && !isExtracting && (
                  <p className="mt-4 text-xs text-slate-500">
                    No resume summary was extracted. No resume details will be
                    added to the interview context.
                  </p>
                )}
              </div>
            </Step>
          </Stepper>
        )}
      </div>
    </main>
  );
}

export default Page;
