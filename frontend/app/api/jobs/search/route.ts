import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { skills, country = 'in', page = 1 } = await request.json();

    if (!skills || !Array.isArray(skills)) {
      return NextResponse.json({ error: "Invalid skills mapping" }, { status: 400 });
    }

    // Format Adzuna credentials from env vars
    // Please replace or provide ADZUNA_APP_ID & ADZUNA_APP_KEY into your .env
    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "6719c685";
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "0ec9f481a53a7e0c39bc589dfe6d4454";

    // Convert extracted skills to Adzuna `what` parameter search format
    const searchTerms = skills.slice(0, 5).map(skill => encodeURIComponent(skill)).join(' ');

    // Call the external jobs API
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${searchTerms}&results_per_page=50`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch jobs. Adzuna returned status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({ success: true, jobs: data.results || [] });
  } catch (err: any) {
    console.error("Adzuna Request Error:", err);
    return NextResponse.json({ error: "Error contacting jobs provider", details: err.message }, { status: 500 });
  }
}
