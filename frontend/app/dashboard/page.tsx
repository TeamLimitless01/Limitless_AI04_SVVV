import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import DashboardView from "./dashboard-view";
import { getCachedDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: string; name?: string | null }
    | undefined;

  if (!user?.id) redirect("/auth/login");

  const dashboard = await getCachedDashboardData(user.id);

  return (
    <DashboardView
      dashboard={dashboard}
      candidateName={user.name || "Candidate"}
    />
  );
}
