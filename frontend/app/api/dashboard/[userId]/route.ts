import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Interview } from "@/models/Interview";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await dbConnect();
    const userId = params.userId;

    const interviewsParams = await Interview.find({ user: userId }).sort({ createdAt: -1 }).exec();

    let totalInterviews = interviewsParams.length;
    let avgOverall = 0, avgConfidence = 0, avgCommunication = 0;

    // For trends
    const trendMap: Record<string, { total: number; count: number }> = {};
    const skillCountMap: Record<string, number> = {};

    let sumTech = 0, sumComm = 0, sumProb = 0, sumConf = 0, sumEng = 0;
    let reportCount = 0;

    const recentReports = [];

    for (let i = 0; i < interviewsParams.length; i++) {
      const itv = interviewsParams[i];
      let reportStr = itv.report;

      if (itv.skills) {
        const splitSkills = itv.skills.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
        splitSkills.forEach((s: string) => {
          skillCountMap[s] = (skillCountMap[s] || 0) + 1;
        });
      }

      if (!reportStr) continue;

      let reportObj;
      try {
        reportObj = typeof reportStr === 'string' ? JSON.parse(reportStr) : reportStr;
      } catch (e) {
        continue;
      }

      const scores = reportObj.scores || {};

      reportCount++;
      avgOverall += (scores.overall || 0);
      avgConfidence += (scores.confidenceLevel || 0);
      avgCommunication += (scores.communication || 0);

      sumTech += (scores.technicalKnowledge || 0);
      sumComm += (scores.communication || 0);
      sumProb += (scores.problemSolving || 0);
      sumConf += (scores.confidenceLevel || 0);
      sumEng += (scores.engagement || 0);

      // Trend data
      const dateKey = new Date(itv.createdAt as any).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!trendMap[dateKey]) trendMap[dateKey] = { total: 0, count: 0 };
      trendMap[dateKey].total += (scores.overall || 0);
      trendMap[dateKey].count++;

      if (recentReports.length < 5) {
        recentReports.push({
          id: itv._id.toString(),
          candidateName: itv.candidateName || "Candidate",
          jobRole: itv.details || "General",
          recommendation: (scores.potentialFit || 0) >= 7 ? 'Yes' : 'No',
          overallScore: scores.overall || 0,
          date: dateKey
        });
      }
    }

    if (reportCount > 0) {
      avgOverall = parseFloat((avgOverall / reportCount).toFixed(1));
      avgConfidence = parseFloat((avgConfidence / reportCount).toFixed(1));
      avgCommunication = parseFloat((avgCommunication / reportCount).toFixed(1));
    }

    const trendData = Object.keys(trendMap).map(k => ({
      date: k,
      avgScore: parseFloat((trendMap[k].total / trendMap[k].count).toFixed(1))
    })).reverse(); // Reverse if dict iteration didn't order chronologically, actually dict keeps insertion order for strings.
    // Ensure trend data is sorted chronologically? We traversed from new to old, so let's reverse.
    trendData.reverse();

    const categoryStats = reportCount > 0 ? [
      { category: "Technical", avgScore: parseFloat((sumTech / reportCount).toFixed(1)) },
      { category: "Comm", avgScore: parseFloat((sumComm / reportCount).toFixed(1)) },
      { category: "Problem Solving", avgScore: parseFloat((sumProb / reportCount).toFixed(1)) },
      { category: "Confidence", avgScore: parseFloat((sumConf / reportCount).toFixed(1)) },
      { category: "Engagement", avgScore: parseFloat((sumEng / reportCount).toFixed(1)) }
    ] : [];

    const skillDistribution = Object.keys(skillCountMap).map(k => ({
      skill: k.length > 10 ? k.substring(0, 10) + '...' : k,
      count: skillCountMap[k]
    })).sort((a, b) => b.count - a.count).slice(0, 7);

    return NextResponse.json({
      data: {
        overview: {
          totalInterviews,
          avgOverall,
          avgConfidence,
          avgCommunication
        },
        charts: {
          trendData,
          categoryStats,
          skillDistribution
        },
        recentReports
      }
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
