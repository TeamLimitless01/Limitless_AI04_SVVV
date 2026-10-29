import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { getCachedReports } from "@/lib/reports";
import ReportsView from "./reports-view";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { interviewId?: string };
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;

  if (!user?.id) redirect("/auth/login");

  const interviews = await getCachedReports(user.id);

  return (
    <ReportsView
      interviews={interviews}
      initialInterviewId={searchParams?.interviewId}
    />
  );
}
