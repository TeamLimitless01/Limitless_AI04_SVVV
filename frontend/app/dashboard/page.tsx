"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  AreaChart,
  Area,
  PolarRadiusAxis,
} from "recharts";
import { useStrapi } from "@/lib/api/useStrapi";
import { useSession } from "next-auth/react";
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Users, 
  Target, 
  Zap, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  ArrowUpRight,
  BrainCircuit,
  MessageSquare,
  Search
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: session } = useSession<any>();
  const { data, error, isLoading } = useStrapi(
    `dashboard/${session?.user?.id}`,
    {
      populate: "*",
    }
  );

  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    if (data) setDashboard(data);
  }, [data]);

  if (isLoading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#020617]">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Synchronizing Data...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-[#020617] text-rose-400 font-bold p-10 text-center">
        <div className="glass-card p-8 rounded-3xl border-rose-500/20 max-w-md">
          Authentication or Data Sync failed. Please try logging in again.
        </div>
      </div>
    );

  if (!dashboard) return null;

  const { overview, charts, recentReports } = dashboard;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="relative min-h-screen selection:bg-blue-500/30 overflow-x-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 md:py-40">
        {/* Header Area */}
        <header className="mb-16">
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Central Performance Hub</span>
          </motion.div> */}
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter">
                Performance <span className="text-gradient">Horizon</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                Welcome back, {(session?.user as any)?.name || "Candidate"}. Your career trajectory is currently 
                trending <span className="text-blue-400 font-bold">upwards</span> based on recent sessions.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-slate-100 font-bold shadow-xl shadow-white/5 transition-all">
                <Link href="/create-interview">
                  Start New Session
                  <Zap className="ml-2 h-4 w-4 fill-current text-blue-600" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Overview Cards Verticalized for Impact */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Sessions", value: overview.totalInterviews, icon: Users, color: "blue" },
              { title: "Avg Performance", value: `${overview.avgOverall}/10`, icon: Award, color: "emerald" },
              { title: "Confidence Level", value: `${overview.avgConfidence}/10`, icon: Zap, color: "amber" },
              { title: "Communication", value: `${overview.avgCommunication}/10`, icon: MessageSquare, color: "purple" },
            ].map((item, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <div className="glass-card p-8 rounded-[2rem] border-white/5 bg-white/[0.02] flex flex-col items-start gap-4 hover:bg-white/[0.04] transition-all group">
                  <div className={`p-4 rounded-2xl bg-${item.color}-500/10 text-${item.color}-400 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{item.title}</h2>
                    <p className="text-3xl font-black text-white">{item.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </section>

          {/* Core Analytics Blocks */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Primary Trend Area */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div className="glass-card h-full rounded-[2.5rem] border-white/5 p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                    <h2 className="text-2xl font-black text-white tracking-tight">Success Trajectory</h2>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5">
                    <Calendar className="h-3 w-3" />
                    Last 30 Days
                  </div>
                </div>
                
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.trendData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#334155" fontSize={10} fontWeight={700} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#334155" fontSize={10} fontWeight={700} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 10]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Competency Radar Area */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="glass-card h-full rounded-[2.5rem] border-white/5 p-8 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-10">
                  <BrainCircuit className="h-6 w-6 text-purple-400" />
                  <h2 className="text-2xl font-black text-white tracking-tight">Trait Profile</h2>
                </div>
                
                <div className="w-full h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={charts.categoryStats}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="transparent" tick={false} />
                      <Radar
                        name="Average Score"
                        dataKey="avgScore"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                      />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Activity Feed Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Skill Distribution */}
            <motion.div variants={itemVariants}>
              <div className="glass-card rounded-[2.5rem] border-white/5 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <BarChart3 className="h-6 w-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Category Focus</h2>
                </div>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.skillDistribution}>
                      <XAxis dataKey="skill" stroke="#334155" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                      <Bar dataKey="count" fill="#10b981" radius={[12, 12, 12, 12]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Recent Reports List */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <Search className="h-6 w-6 text-blue-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">Activity Feed</h2>
                </div>
                <Link href="/reports" className="text-xs font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1 group">
                  All Reports
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="space-y-4">
                {recentReports.length > 0 ? (
                  recentReports.slice(0, 4).map((r: any, idx: number) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="glass-card p-6 rounded-3xl border-white/5 hover:bg-white/[0.03] transition-all group flex items-center justify-between gap-6 cursor-pointer" onClick={() => (window.location.href = "/reports")}>
                        <div className="flex items-center gap-5">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black ${r.recommendation === 'Yes' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {r.overallScore}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base leading-tight group-hover:text-blue-400 transition-colors">{r.candidateName}</h3>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{r.jobRole}</p>
                          </div>
                        </div>
                        <div className="hidden sm:flex flex-col items-end">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{r.date}</p>
                          <div className={`flex items-center gap-1 text-[10px] font-bold ${r.recommendation === 'Yes' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {r.recommendation === 'Yes' ? 'HIRE' : 'REVIEW'}
                            <ArrowUpRight className="h-2 w-2" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-center glass-card rounded-3xl border-white/5 opacity-50 italic text-slate-500">
                    No recent session data synthesized yet.
                  </div>
                )}
              </div>
            </motion.div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
