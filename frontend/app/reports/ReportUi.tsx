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
import { User, ClipboardCheck, Brain, Activity, ShieldCheck, Zap, ArrowUpRight, TrendingUp } from "lucide-react";

export default function InterviewReport({ report }: { report?: any }) {
  if (!report) return (
    <div className="flex items-center justify-center p-20 text-slate-500 italic">
      No report data available to display.
    </div>
  );

  const data = report;

  // Safe access to scores
  const scores = data.scores || {};
  const scorecard = data.scorecard;
  const defaultMetricLabels: Record<string, string> = {
    roleKnowledge: "Role knowledge and application",
    problemSolving: "Reasoning and problem solving",
    communication: "Communication and clarity",
  };
  const weighting = scorecard?.weighting || {
    roleKnowledge: { label: defaultMetricLabels.roleKnowledge, weight: 0.4 },
    problemSolving: { label: defaultMetricLabels.problemSolving, weight: 0.35 },
    communication: { label: defaultMetricLabels.communication, weight: 0.25 },
  };
  const scorecardMetrics = scorecard?.metrics
    ? Object.entries(weighting).map(([id, definition]: [string, any]) => ({
        id,
        label: definition.label || defaultMetricLabels[id] || id,
        weight: Math.round(Number(definition.weight) * 100),
      }))
    : [];
  const scoreCoverageNote =
    scorecard?.rubricVersion === "1.2"
      ? `${scorecard.assessedMetricCount}/${scorecard.totalMetricCount} metrics assessed (${scorecard.assessedWeightPercent}% of rubric weight). Unassessed areas are excluded from the overall score.`
      : `Evidence coverage: ${scorecard?.assessedMetricCount}/${scorecard?.totalMetricCount} metrics assessed.`;
  const metricLabel = (id: string) =>
    weighting[id]?.label || defaultMetricLabels[id] || id;

  const scoreBars = [
    { name: metricLabel("roleKnowledge"), value: scores.roleKnowledge ?? scores.technicalKnowledge ?? 0, scored: (scores.roleKnowledge ?? scores.technicalKnowledge) != null, color: "blue" },
    { name: metricLabel("communication"), value: scores.communication ?? 0, scored: scores.communication != null, color: "emerald" },
    { name: metricLabel("problemSolving"), value: scores.problemSolving ?? 0, scored: scores.problemSolving != null, color: "amber" },
  ];

  const radarData = [
    { subject: metricLabel("roleKnowledge"), A: scores.roleKnowledge ?? scores.technicalKnowledge ?? 0, fullMark: 10 },
    { subject: metricLabel("communication"), A: scores.communication ?? 0, fullMark: 10 },
    { subject: metricLabel("problemSolving"), A: scores.problemSolving ?? 0, fullMark: 10 },
  ];

  const formatName = (s: any) =>
    s ? String(s).replace(/(^|\s)\S/g, (t: any) => t.toUpperCase()) : "N/A";

  const candidateInfo = data.candidateInformation || {};
  const isHrInterview = String(candidateInfo.interviewType || "").toLowerCase().includes("hr");
  const answerAnalysis = data.answerAnalysis || { strengths: [], weaknesses: [], insights: [] };
  const overallPerformance = data.overallPerformance || {};
  const summaryAndNextSteps = data.summaryAndNextSteps || { rationale: [], actionableNextSteps: [] };
  const hasCompleteScorecard = scorecardMetrics.every(
    (metric) => scorecard.metrics[metric.id].rating != null
  );
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
    <div className="min-w-0 overflow-x-hidden bg-[#020617] p-3 text-slate-200 sm:p-6 md:p-10 lg:p-12">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        {/* Top Overview Cards */}
        <div className="mb-8 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:mb-12 lg:grid-cols-4 lg:gap-6">
          {/* Candidate Card */}
          <motion.div variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 bg-white/[0.02] p-4 sm:rounded-[2rem] sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                <User className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Candidate</span>
            </div>
            <h3 className="mb-1 break-words text-lg font-bold text-white sm:text-xl">{formatName(candidateInfo.candidateName)}</h3>
            <p className="text-sm text-slate-400 font-medium">{formatName(candidateInfo.jobRole)}</p>
            {candidateInfo.interviewType && <p className="mt-1 text-xs text-slate-500">{candidateInfo.interviewType}</p>}
          </motion.div>

          {/* Performance Card - Replaced Decision with Overall Score */}
          <motion.div variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 bg-white/[0.02] p-4 sm:rounded-[2rem] sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Overall Score</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-1">
              {scores.overall == null ? "Not scored" : scores.overall}<span className="text-lg text-slate-500 font-bold">{scores.overall == null ? "" : "/10"}</span>
            </h3>
            <p className="text-sm text-slate-400 font-medium line-clamp-2">
              {overallPerformance.summary || 'Performance evaluation completed.'}
            </p>
            {scorecard?.rubricVersion === "1.2" && scores.overall != null && (
              <p className="mt-2 text-xs text-slate-500">
                Based on {scorecard.assessedMetricCount}/{scorecard.totalMetricCount} assessable metrics ({scorecard.assessedWeightPercent}% rubric weight).
              </p>
            )}
            {scorecard?.rubricVersion === "1.2" && scores.overall == null && (
              <p className="mt-2 text-xs text-amber-300/80">
                An overall score needs at least two assessable metrics.
              </p>
            )}
          </motion.div>

          {/* Skills Card */}
          <motion.div variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 bg-white/[0.02] p-4 sm:rounded-[2rem] sm:p-6">
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
          <motion.div variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 bg-white/[0.02] p-4 sm:rounded-[2rem] sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Session</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{candidateInfo.interviewTime || 15} Minutes</h3>
            <p className="text-sm text-slate-400 font-medium capitalize">{candidateInfo.difficulty || 'Normal'} Difficulty</p>
          </motion.div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          {/* Main Analysis Column */}
          <div className="min-w-0 space-y-4 lg:col-span-2 lg:space-y-8">
            {/* Answer Analysis */}
            <motion.section variants={itemVariants} className="glass-card relative min-w-0 overflow-hidden rounded-2xl border-white/5 p-4 sm:rounded-3xl sm:p-6 md:p-8 lg:rounded-[2.5rem] lg:p-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
              <div className="relative z-10">
                <div className="mb-5 flex items-center gap-3 sm:mb-8">
                  <ClipboardCheck className="h-5 w-5 shrink-0 text-blue-400 sm:h-6 sm:w-6" />
                  <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">Answer Analysis</h2>
                </div>
                
                <p className="mb-6 break-words border-l-2 border-blue-500/30 pl-4 text-base italic leading-relaxed text-slate-400 sm:mb-10 sm:pl-6 sm:text-lg">
                  "{answerAnalysis.candidateAnswersSummary || 'No summary available.'}"
                </p>

                {Array.isArray(answerAnalysis.answerFeedback) &&
                  answerAnalysis.answerFeedback.length > 0 && (
                    <div className="mb-6 space-y-4 sm:mb-8">
                      <h3 className="text-sm font-black uppercase tracking-widest text-blue-300">
                        Question-by-question feedback
                      </h3>
                      {answerAnalysis.answerFeedback.map(
                        (
                          feedback: {
                            question: string;
                            answerMessageIndex: number;
                            observation: string;
                            nextStep: string;
                            evidenceQuote: string;
                          },
                          index: number,
                        ) => (
                          <article
                            key={`${feedback.answerMessageIndex}-${index}`}
                            className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:rounded-3xl sm:p-6"
                          >
                            <p className="mb-4 text-sm font-semibold leading-relaxed text-white">
                              <span className="mr-2 text-blue-400">
                                Q{index + 1}.
                              </span>
                              {feedback.question}
                            </p>
                            <blockquote className="mb-4 border-l-2 border-blue-500/40 pl-3 text-sm italic leading-relaxed text-slate-400">
                              “{feedback.evidenceQuote}”
                            </blockquote>
                            <p className="mb-3 text-sm leading-relaxed text-slate-300">
                              {feedback.observation}
                            </p>
                            <p className="text-sm leading-relaxed text-blue-200">
                              <span className="font-bold text-blue-300">
                                Try next:
                              </span>{" "}
                              {feedback.nextStep}
                            </p>
                          </article>
                        ),
                      )}
                    </div>
                  )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 sm:rounded-3xl sm:p-6">
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

                  <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 sm:rounded-3xl sm:p-6">
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

                <div className="mt-6 grid grid-cols-1 gap-5 border-t border-white/5 pt-6 sm:mt-10 sm:grid-cols-2 sm:gap-6 sm:pt-10 lg:grid-cols-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Communication</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{answerAnalysis.communicationStyle || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                      {isHrInterview ? "Judgment & Reflection" : "Problem Solving"}
                    </h4>
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
            <motion.section variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent p-4 sm:rounded-3xl sm:p-6 md:p-8 lg:rounded-[2.5rem] lg:p-10">
              <div className="mb-5 flex items-center gap-3 sm:mb-6">
                <Brain className="h-5 w-5 shrink-0 text-purple-400 sm:h-6 sm:w-6" />
                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">AI Summary & Rationale</h2>
              </div>
              <p className="mb-6 text-base leading-relaxed text-slate-300 sm:mb-8 sm:text-lg">
                {summaryAndNextSteps.finalSummary || 'No final summary generated.'}
              </p>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
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
          <div className="min-w-0 space-y-4 lg:space-y-8">
            {hasCompleteScorecard ? (
              <motion.section variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 p-4 sm:rounded-3xl sm:p-6 lg:rounded-[2.5rem] lg:p-8">
                <h3 className="mb-5 text-lg font-bold tracking-tight text-white sm:mb-8 sm:text-xl">Competency Radar</h3>
                <div className="relative h-56 sm:h-64">
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
            ) : (
              <motion.section variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 p-4 sm:rounded-3xl sm:p-6 lg:rounded-[2.5rem] lg:p-8">
                <h3 className="mb-3 text-lg font-bold tracking-tight text-white sm:text-xl">Competency Radar</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  The radar is hidden because one or more metrics were not assessable from the transcript.
                </p>
              </motion.section>
            )}

            <motion.section variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 p-4 sm:rounded-3xl sm:p-6 lg:rounded-[2.5rem] lg:p-8">
              <h3 className="mb-5 text-lg font-bold tracking-tight text-white sm:mb-6 sm:text-xl">Metric Distribution</h3>
              <div className="space-y-6">
                {scoreBars.map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                      <span className="text-slate-500">{s.name}</span>
                      <span className="text-white">{s.scored ? `${s.value}/10` : "Not assessed"}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.value / 10) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full bg-gradient-to-r ${
                          s.color === 'blue' ? 'from-blue-600 to-blue-400' :
                          s.color === 'emerald' ? 'from-emerald-600 to-emerald-400' :
                          'from-amber-600 to-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {scorecardMetrics.length > 0 && (
              <motion.section variants={itemVariants} className="glass-card min-w-0 rounded-2xl border-white/5 p-4 sm:rounded-3xl sm:p-6 lg:rounded-[2.5rem] lg:p-8">
                <h3 className="mb-2 text-lg font-bold tracking-tight text-white sm:text-xl">Evidence-Based Scorecard</h3>
                <p className="text-xs leading-relaxed text-slate-500 mb-6">
                  Rubric {scorecard.rubricVersion}: ratings use transcript evidence.{" "}
                  {scorecard.rubricVersion === "1.2"
                    ? "The overall score is weighted across assessable metrics only; at least two metrics are required."
                    : "The overall score is calculated from the listed weights."}
                </p>
                <p className="text-xs text-slate-400 mb-6">
                  {scoreCoverageNote}
                </p>
                <div className="space-y-6">
                  {scorecardMetrics.map((metric) => {
                    const assessment = scorecard.metrics[metric.id];
                    return (
                      <div key={metric.id} className="border-t border-white/5 pt-4 first:border-0 first:pt-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-200">{metric.label}</h4>
                            <p className="text-xs text-slate-500">Weight: {metric.weight}%</p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-white">
                            {assessment.rating == null ? "Not assessed" : `${assessment.rating}/4`}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {assessment.evidence.map((evidence: { messageIndex: number; quote: string }, index: number) => (
                            <blockquote
                              key={`${metric.id}-${evidence.messageIndex}-${index}`}
                              className="break-words rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-slate-400"
                            >
                              “{evidence.quote}”
                              <footer className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                                Transcript message {evidence.messageIndex + 1}
                              </footer>
                            </blockquote>
                          ))}
                          {assessment.rating == null && (
                            <p className="text-xs italic text-slate-500">Insufficient transcript evidence to assess this metric.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-6 border-t border-white/5 pt-4 text-[11px] leading-relaxed text-slate-500">
                  This scorecard summarizes interview evidence and is not a hiring decision.
                </p>
              </motion.section>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  );
}
