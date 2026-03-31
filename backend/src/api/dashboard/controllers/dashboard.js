const dayjs = require("dayjs");

module.exports = {
  async getDashboardData(ctx) {
    try {
      const { userId } = ctx.params;

      // Fetch all interviews for the user
      const interviews = await strapi.db
        .query("api::interview.interview")
        .findMany({
          where: { user: userId, publishedAt: { $notNull: true } },
          populate: true,
        });

      if (!interviews.length) {
        return ctx.send({
          overview: {
            totalInterviews: 0,
            avgOverall: 0,
            avgConfidence: 0,
            avgCommunication: 0,
          },
          charts: { trendData: [], skillDistribution: [], categoryStats: [] },
          recentReports: [],
        });
      }

      // Initialize accumulators
      let totalOverall = 0;
      let totalConfidence = 0;
      let totalCommunication = 0;

      const trendMap = {};
      const skillMap = {};
      const categoryMap = {};
      const recentReports = [];

      for (const interview of interviews) {
        const report = interview.report || {};
        const scores = report.scores || {};

        // Basic scores
        const overall = scores.overall || 0;
        const confidence = scores.confidenceLevel || 0;
        const communication = scores.communication || 0;

        totalOverall += overall;
        totalConfidence += confidence;
        totalCommunication += communication;

        // 📈 Trend data by date
        const date = dayjs(interview.createdAt).format("YYYY-MM-DD");
        if (!trendMap[date]) {
          trendMap[date] = { date, overallSum: 0, count: 0 };
        }
        trendMap[date].overallSum += overall;
        trendMap[date].count += 1;

        // 🧠 Skill performance (handle comma-separated string)
        if (interview.skills) {
          const skillsArray = Array.isArray(interview.skills)
            ? interview.skills
            : interview.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

          for (const skill of skillsArray) {
            const lowerSkill = skill.toLowerCase();
            if (!skillMap[lowerSkill])
              skillMap[lowerSkill] = { skill: lowerSkill, count: 0 };
            skillMap[lowerSkill].count += 1;
          }
        }

        // 🗂️ Category (based on mode/difficulty)
        const category = interview.mode || "General";
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            count: 0,
            totalScore: 0,
          };
        }
        categoryMap[category].count += 1;
        categoryMap[category].totalScore += overall;

        // 🕓 Recent interviews
        recentReports.push({
          id: interview.id,
          candidateName: interview.candidateName || "N/A",
          jobRole: report.candidateInformation?.jobRole || "N/A",
          mode: interview.mode,
          difficulty: interview.difficulty,
          totalQuestions: interview.numberOfQuestions,
          overallScore: overall,
          confidenceScore: confidence,
          summary: report.overallPerformance?.summary || "No summary available",
          recommendation:
            report.overallPerformance?.hiringRecommendation || "N/A",
          date,
        });
      }

      // ✅ Convert to arrays for charts
      const trendData = Object.values(trendMap).map((t) => ({
        date: t.date,
        avgScore: (t.overallSum / t.count).toFixed(2),
      }));

      const skillDistribution = Object.values(skillMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 skills

      const categoryStats = Object.values(categoryMap).map((c) => ({
        category: c.category,
        avgScore: (c.totalScore / c.count).toFixed(2),
        interviews: c.count,
      }));

      // 📊 Compute averages
      const total = interviews.length;
      const overview = {
        totalInterviews: total,
        avgOverall: (totalOverall / total).toFixed(2),
        avgConfidence: (totalConfidence / total).toFixed(2),
        avgCommunication: (totalCommunication / total).toFixed(2),
      };

      // 🔄 Sort by latest
      recentReports.sort((a, b) => new Date(b.date) - new Date(a.date));

      ctx.send({
        overview,
        charts: {
          trendData,
          skillDistribution,
          categoryStats,
        },
        recentReports: recentReports.slice(0, 5),
      });
    } catch (err) {
      console.error(err);
      ctx.throw(500, "Error fetching dashboard analytics");
    }
  },
};
