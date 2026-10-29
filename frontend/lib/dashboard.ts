import { unstable_cache } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { Interview } from "@/models/Interview";

export interface DashboardData {
  overview: {
    totalInterviews: number;
    avgOverall: number;
    avgCommunication: number;
  };
  charts: {
    trendData: { date: string; avgScore: number }[];
    categoryStats: { category: string; avgScore: number }[];
    skillDistribution: { skill: string; count: number }[];
  };
  recentReports: {
    id: string;
    candidateName: string;
    jobRole: string;
    overallScore: number;
    date: string;
  }[];
}

export const dashboardCacheTag = (userId: string) => `dashboard-${userId}`;

async function loadDashboardData(userId: string): Promise<DashboardData> {
  await dbConnect();
  const interviews = await Interview.find({ user: userId })
    .sort({ createdAt: -1 })
    .exec();
  const trendMap: Record<string, { total: number; count: number }> = {};
  const skillCountMap: Record<string, number> = {};
  const recentReports: DashboardData["recentReports"] = [];

  let avgOverall = 0;
  let avgCommunication = 0;
  let sumTech = 0;
  let sumComm = 0;
  let sumProb = 0;
  let reportCount = 0;

  for (const interview of interviews) {
    if (interview.skills) {
      interview.skills
        .split(",")
        .map((skill) => skill.trim().toLowerCase())
        .filter(Boolean)
        .forEach((skill) => {
          skillCountMap[skill] = (skillCountMap[skill] || 0) + 1;
        });
    }

    if (!interview.report) continue;

    let report: { scores?: Record<string, unknown> };
    try {
      report =
        typeof interview.report === "string"
          ? JSON.parse(interview.report)
          : interview.report;
    } catch {
      continue;
    }

    const scores = report?.scores;
    if (
      !scores ||
      typeof scores.overall !== "number" ||
      !Number.isFinite(scores.overall)
    ) {
      continue;
    }

    const overall = scores.overall;
    const communication =
      typeof scores.communication === "number" ? scores.communication : 0;
    const technical =
      typeof scores.roleKnowledge === "number"
        ? scores.roleKnowledge
        : typeof scores.technicalKnowledge === "number"
          ? scores.technicalKnowledge
          : 0;
    const problemSolving =
      typeof scores.problemSolving === "number" ? scores.problemSolving : 0;

    reportCount++;
    avgOverall += overall;
    avgCommunication += communication;
    sumTech += technical;
    sumComm += communication;
    sumProb += problemSolving;

    const date = new Date(interview.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    trendMap[date] ??= { total: 0, count: 0 };
    trendMap[date].total += overall;
    trendMap[date].count++;

    if (recentReports.length < 5) {
      recentReports.push({
        id: interview._id.toString(),
        candidateName: interview.candidateName || "Candidate",
        jobRole: interview.details || "General",
        overallScore: overall,
        date,
      });
    }
  }

  if (reportCount > 0) {
    avgOverall = Number((avgOverall / reportCount).toFixed(1));
    avgCommunication = Number((avgCommunication / reportCount).toFixed(1));
  }

  const categoryStats =
    reportCount > 0
      ? [
          { category: "Role Knowledge", avgScore: Number((sumTech / reportCount).toFixed(1)) },
          { category: "Comm", avgScore: Number((sumComm / reportCount).toFixed(1)) },
          { category: "Problem Solving", avgScore: Number((sumProb / reportCount).toFixed(1)) },
        ]
      : [];

  return {
    overview: {
      totalInterviews: interviews.length,
      avgOverall,
      avgCommunication,
    },
    charts: {
      trendData: Object.entries(trendMap).map(([date, value]) => ({
        date,
        avgScore: Number((value.total / value.count).toFixed(1)),
      })),
      categoryStats,
      skillDistribution: Object.entries(skillCountMap)
        .map(([skill, count]) => ({
          skill: skill.length > 10 ? `${skill.substring(0, 10)}...` : skill,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7),
    },
    recentReports,
  };
}

export function getCachedDashboardData(userId: string) {
  return unstable_cache(
    () => loadDashboardData(userId),
    ["dashboard-data", userId],
    { revalidate: 300, tags: [dashboardCacheTag(userId)] }
  )();
}
