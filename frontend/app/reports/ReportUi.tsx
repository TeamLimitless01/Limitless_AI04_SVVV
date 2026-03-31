import React from "react";
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { User, ClipboardCheck, Brain, Smile, Activity, ShieldCheck, Zap, ArrowUpRight, TrendingUp } from "lucide-react";

export default function InterviewReport({ report }: { report?: any }) {
  if (!report) return (
    <div className="flex items-center justify-center p-20 text-slate-500 italic">
      No report data available to display.
    </div>
  );

  const data = report;

  // Safe access to scores
  const scores = data.scores || {};
  
  const scoreBars = [
    { name: "Technical", value: scores.technicalKnowledge || 0, color: "blue" },
    { name: "Communication", value: scores.communication || 0, color: "emerald" },
    { name: "Problem Solving", value: scores.problemSolving || 0, color: "amber" },
    { name: "Confidence", value: scores.confidenceLevel || 0, color: "indigo" },
    { name: "Engagement", value: scores.engagement || 0, color: "rose" },
    { name: "Composure", value: scores.composure || 0, color: "purple" },
  ];

  const radarData = [
    { subject: "Technical", A: scores.technicalKnowledge || 0, fullMark: 10 },
    { subject: "Communication", A: scores.communication || 0, fullMark: 10 },
    { subject: "Problem Solving", A: scores.problemSolving || 0, fullMark: 10 },
    { subject: "Confidence", A: scores.confidenceLevel || 0, fullMark: 10 },
    { subject: "Engagement", A: scores.engagement || 0, fullMark: 10 },
    { subject: "Composure", A: scores.composure || 0, fullMark: 10 },
  ];

  const formatName = (s: any) =>
    s ? String(s).replace(/(^|\s)\S/g, (t: any) => t.toUpperCase()) : "N/A";

  const candidateInfo = data.candidateInformation || {};
  const answerAnalysis = data.answerAnalysis || { strengths: [], weaknesses: [], insights: [] };
  const overallPerformance = data.overallPerformance || {};
  const summaryAndNextSteps = data.summaryAndNextSteps || { rationale: [], actionableNextSteps: [] };
  const facialAnalytics = data.facialAnalytics || {};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const skillsList = typeof candidateInfo.skillsAssessed === 'string' 
    ? candidateInfo.skillsAssessed.split(',').filter(Boolean).map((s: string) => s.trim())
    : [];

  return (
    <div className="bg-[#020617] p-8 md:p-12 text-slate-200">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Candidate Card */}
          <motion.div variants={itemVariants} className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                <User className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Candidate</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{formatName(candidateInfo.candidateName)}</h3>
            <p className="text-sm text-slate-400 font-medium">{formatName(candidateInfo.jobRole)}</p>
          </motion.div>

          {/* Performance Card - Replaced Decision with Overall Score */}
          <motion.div variants={itemVariants} className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Overall Score</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">
              {scores.overall || 0}<span className="text-lg text-slate-500 font-bold">/10</span>
            </h3>
            <p className="text-sm text-slate-400 font-medium line-clamp-1">{overallPerformance.summary || 'Performance evaluation completed.'}</p>
          </motion.div>

          {/* Skills Card */}
          <motion.div variants={itemVariants} className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Core Skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsList.length > 0 ? skillsList.slice(0, 3).map((skill: string) => (
                <span key={skill} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400">{skill}</span>
              )) : <span className="text-slate-500 text-xs">N/A</span>}
            </div>
          </motion.div>

          {/* Session Detail */}
          <motion.div variants={itemVariants} className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Session</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{candidateInfo.numOfQuestions || 0} Questions</h3>
            <p className="text-sm text-slate-400 font-medium capitalize">{candidateInfo.difficulty || 'Normal'} Difficulty</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Analysis Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Answer Analysis */}
            <motion.section variants={itemVariants} className="glass-card rounded-[2.5rem] border-white/5 p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <ClipboardCheck className="h-6 w-6 text-blue-400" />
                  <h2 className="text-2xl font-black text-white tracking-tight">Answer Analysis</h2>
                </div>
                
                <p className="text-slate-400 text-lg leading-relaxed mb-10 italic border-l-2 border-blue-500/30 pl-6">
                  "{answerAnalysis.candidateAnswersSummary || 'No summary available.'}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                       <ShieldCheck className="h-4 w-4" /> Performance Strengths
                    </h3>
                    <ul className="space-y-3">
                      {(answerAnalysis.strengths || []).length > 0 ? answerAnalysis.strengths.map((s: string, idx: number) => (
                        <li key={idx} className="text-slate-300 text-sm flex gap-3">
                          <span className="text-emerald-500 font-bold">•</span> {s}
                        </li>
                      )) : <p className="text-slate-500 text-sm italic">None identified.</p>}
                    </ul>
                  </div>

                  <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10">
                    <h3 className="text-sm font-black uppercase tracking-widest text-rose-400 mb-4 flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Improvement Areas
                    </h3>
                    <ul className="space-y-3">
                      {(answerAnalysis.weaknesses || []).length > 0 ? answerAnalysis.weaknesses.map((w: string, idx: number) => (
                        <li key={idx} className="text-slate-300 text-sm flex gap-3">
                          <span className="text-rose-500 font-bold">•</span> {w}
                        </li>
                      )) : <p className="text-slate-500 text-sm italic">None identified.</p>}
                    </ul>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-white/5">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Communication</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{answerAnalysis.communicationStyle || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Problem Solving</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{answerAnalysis.problemSolvingApproach || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Internal Insights</h4>
                    <ul className="text-slate-300 text-sm space-y-1">
                      {(answerAnalysis.insights || []).length > 0 ? answerAnalysis.insights.map((ins: string, idx: number) => (
                        <li key={idx} className="flex gap-2"><span className="text-blue-500 opacity-50">•</span> {ins}</li>
                      )) : <p className="text-slate-500 text-xs italic">No specific insights.</p>}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Final Summary Card */}
            <motion.section variants={itemVariants} className="glass-card rounded-[2.5rem] border-white/5 p-8 md:p-10 bg-gradient-to-br from-blue-600/10 to-transparent">
              <div className="flex items-center gap-3 mb-6">
                <Brain className="h-6 w-6 text-purple-400" />
                <h2 className="text-2xl font-black text-white tracking-tight">AI Summary & Rationale</h2>
              </div>
              <p className="text-lg text-slate-300 leading-relaxed mb-8">
                {summaryAndNextSteps.finalSummary || 'No final summary generated.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">The Logic</h4>
                  <ul className="space-y-3">
                    {(summaryAndNextSteps.rationale || []).length > 0 ? summaryAndNextSteps.rationale.map((r: string, idx: number) => (
                      <li key={idx} className="text-sm text-slate-400 flex gap-3">
                        <ArrowUpRight className="h-4 w-4 text-blue-500 flex-shrink-0" /> {r}
                      </li>
                    )) : <p className="text-slate-500 text-sm italic">Rationale not specified.</p>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Action Pipeline</h4>
                  <ul className="space-y-3">
                    {(summaryAndNextSteps.actionableNextSteps || []).length > 0 ? summaryAndNextSteps.actionableNextSteps.map((a: string, idx: number) => (
                      <li key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm text-white">
                        {a}
                      </li>
                    )) : <p className="text-slate-500 text-sm italic">No next steps defined.</p>}
                  </ul>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Sidebar Area: Visual Metrics */}
          <div className="space-y-8">
            <motion.section variants={itemVariants} className="glass-card rounded-[2.5rem] border-white/5 p-8">
              <h3 className="text-xl font-bold text-white mb-8 tracking-tight">Competency Radar</h3>
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#ffffff10', borderRadius: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="glass-card rounded-[2.5rem] border-white/5 p-8">
              <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Metric Distribution</h3>
              <div className="space-y-6">
                {scoreBars.map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                      <span className="text-slate-500">{s.name}</span>
                      <span className="text-white">{s.value}/10</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.value / 10) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full bg-gradient-to-r ${
                          s.color === 'blue' ? 'from-blue-600 to-blue-400' :
                          s.color === 'emerald' ? 'from-emerald-600 to-emerald-400' :
                          s.color === 'amber' ? 'from-amber-600 to-amber-400' :
                          s.color === 'indigo' ? 'from-indigo-600 to-indigo-400' :
                          s.color === 'rose' ? 'from-rose-600 to-rose-400' :
                          'from-purple-600 to-purple-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section variants={itemVariants} className="glass-card rounded-[2.5rem] border-white/5 p-8 bg-blue-600/5 border-blue-500/20">
              <div className="flex items-center gap-3 mb-6">
                <Smile className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white tracking-tight">Facial Analytics</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {facialAnalytics.emotionSummary || 'Facial metrics not captured for this session.'}
              </p>
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Vision Logs</p>
                <p className="text-slate-400 text-sm italic">"{facialAnalytics.notes || 'No vision data detected.'}"</p>
              </div>
            </motion.section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
