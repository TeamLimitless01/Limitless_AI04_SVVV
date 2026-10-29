import { unstable_cache } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { Interview } from "@/models/Interview";

export interface ReportInterview {
  id: string;
  documentId: string;
  details?: string;
  skills?: string;
  createdAt: string;
  report: unknown;
  conversation: unknown;
  difficulty?: string;
  mode?: string;
  candidateName?: string;
}

export const reportsCacheTag = (userId: string) => `reports-${userId}`;

async function loadReports(userId: string): Promise<ReportInterview[]> {
  await dbConnect();
  const interviews = await Interview.find({ user: userId })
    .select(
      "_id details skills createdAt report conversation difficulty mode candidateName"
    )
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean()
    .exec();

  return interviews.map((interview) => ({
    id: String(interview._id),
    documentId: String(interview._id),
    details: interview.details,
    skills: interview.skills,
    createdAt: new Date(interview.createdAt).toISOString(),
    report:
      interview.report == null
        ? null
        : JSON.parse(JSON.stringify(interview.report)),
    conversation:
      interview.conversation == null
        ? null
        : JSON.parse(JSON.stringify(interview.conversation)),
    difficulty: interview.difficulty,
    mode: interview.mode,
    candidateName: interview.candidateName,
  }));
}

export function getCachedReports(userId: string) {
  return unstable_cache(
    () => loadReports(userId),
    ["interview-reports", userId],
    { revalidate: 300, tags: [reportsCacheTag(userId)] }
  )();
}
