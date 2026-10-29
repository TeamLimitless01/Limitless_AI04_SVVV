import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Interview } from "@/models/Interview";
import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { dashboardCacheTag } from "@/lib/dashboard";
import { reportsCacheTag } from "@/lib/reports";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user");
    const documentId = searchParams.get("documentId");
    const limit = searchParams.get("limit");
    const sort = searchParams.get("sort");

    let query: any = {};
    if (userId) query.user = userId;
    if (documentId) query._id = documentId;

    let dbQuery = Interview.find(query);

    if (sort) {
      if (sort === "updatedAt:desc") dbQuery = dbQuery.sort({ updatedAt: -1 });
      else if (sort === "updatedAt:asc") dbQuery = dbQuery.sort({ updatedAt: 1 });
      else if (sort === "createdAt:desc") dbQuery = dbQuery.sort({ createdAt: -1 });
      else if (sort === "createdAt:asc") dbQuery = dbQuery.sort({ createdAt: 1 });
    } else {
      dbQuery = dbQuery.sort({ createdAt: -1 });
    }

    if (limit) {
      dbQuery = dbQuery.limit(parseInt(limit, 10));
    }

    const interviews = await dbQuery.exec();
    return NextResponse.json({ data: interviews.map(i => i.toJSON()) });
  } catch (error: any) {
    console.error("GET Interviews Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const data = body.data;

    const interview = await Interview.create(data);
    if (interview.user) {
      const userId = interview.user.toString();
      revalidateTag(dashboardCacheTag(userId));
      revalidateTag(reportsCacheTag(userId));
    }
    revalidatePath("/reports");
    return NextResponse.json({ data: interview.toJSON() });
  } catch (error: any) {
    console.error("POST Interviews Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const data = body.data;

    const previous = await Interview.findById(id).select("user").lean().exec();
    const updated = await Interview.findByIdAndUpdate(id, data, { new: true });
    const affectedUserIds = new Set(
      [previous?.user, updated?.user]
        .filter(Boolean)
        .map((userId) => userId!.toString())
    );
    for (const userId of affectedUserIds) {
      revalidateTag(dashboardCacheTag(userId));
      revalidateTag(reportsCacheTag(userId));
    }
    revalidatePath("/reports");
    return NextResponse.json({ data: updated?.toJSON() });
  } catch (error: any) {
    console.error("PUT Interviews Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
