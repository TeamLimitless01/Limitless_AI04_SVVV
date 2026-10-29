import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getCachedDashboardData } from "@/lib/dashboard";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { id?: string } | undefined;
    if (!user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (user.id !== params.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const data = await getCachedDashboardData(user.id);
    return NextResponse.json({ data });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Dashboard request failed" },
      { status: 500 }
    );
  }
}
