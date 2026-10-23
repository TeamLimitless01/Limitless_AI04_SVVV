import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const supportedCountries = new Set([
  "at", "au", "be", "br", "ca", "ch", "de", "es", "fr", "gb",
  "in", "it", "mx", "nl", "nz", "pl", "sg", "us", "za",
]);
const currencyByCountry: Record<string, string> = {
  at: "EUR", au: "AUD", be: "EUR", br: "BRL", ca: "CAD", ch: "CHF",
  de: "EUR", es: "EUR", fr: "EUR", gb: "GBP", in: "INR", it: "EUR",
  mx: "MXN", nl: "EUR", nz: "NZD", pl: "PLN", sg: "SGD", us: "USD",
  za: "ZAR",
};

const searchSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
  jobRole: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
});

type AdzunaJob = {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  category?: { label?: string };
  salary_min?: number;
  salary_max?: number;
};

function isUsableJob(
  job: AdzunaJob,
): job is AdzunaJob & { id: string | number; title: string; redirect_url: string } {
  if (job.id === undefined || job.id === null || !job.title || !job.redirect_url) return false;

  try {
    return new URL(job.redirect_url).protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide between 1 and 10 valid skills." }, { status: 400 });
  }

 const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "6719c685";
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "0ec9f481a53a7e0c39bc589dfe6d4454";
  const appId = ADZUNA_APP_ID.trim();
  const appKey = ADZUNA_APP_KEY.trim();
  
  if (!appId || !appKey) {
    console.error("Adzuna credentials are not configured.");
    return NextResponse.json(
      { error: "Job search is temporarily unavailable. Adzuna is not configured." },
      { status: 503 },
    );
  }

  const country = (process.env.ADZUNA_COUNTRY || "in").trim().toLowerCase();
  if (!supportedCountries.has(country)) {
    console.error("ADZUNA_COUNTRY must be a supported two-letter Adzuna market.");
    return NextResponse.json({ error: "Job search is misconfigured." }, { status: 500 });
  }

  const { skills, jobRole, location } = parsed.data;
  const uniqueSkills = [...new Set(skills.map((skill) => skill.trim()).filter(Boolean))];
  if (uniqueSkills.length === 0) {
    return NextResponse.json({ error: "Provide at least one non-empty skill." }, { status: 400 });
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "20",
    sort_by: "relevance",
    max_days_old: "30",
  });
  params.set("what", jobRole?.trim() || uniqueSkills.slice(0, 5).join(" "));
  if (jobRole?.trim() && uniqueSkills.length > 0) {
    params.set("what_or", uniqueSkills.slice(0, 5).join(" "));
  }
  if (location?.trim()) params.set("where", location.trim());

  try {
    const response = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      console.error(`Adzuna returned status ${response.status}.`);
      return NextResponse.json(
        { error: "Adzuna could not complete the job search. Please try again shortly." },
        { status: 502 },
      );
    }

    const data: { results?: unknown } = await response.json();
    const jobs = (Array.isArray(data.results) ? data.results : [])
      .filter((job): job is AdzunaJob => Boolean(job && typeof job === "object"))
      .filter(isUsableJob)
      .map((job) => ({
        id: String(job.id),
        title: job.title,
        description: job.description || "",
        redirect_url: job.redirect_url,
        created: job.created || "",
        company: job.company || {},
        location: job.location || {},
        category: job.category || {},
        salary_min: job.salary_min,
        salary_max: job.salary_max,
      }));

    return NextResponse.json({
      success: true,
      jobs,
      total: jobs.length,
      currency: currencyByCountry[country],
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Adzuna took too long to respond. Please try again." },
        { status: 504 },
      );
    }

    console.error("Adzuna job search failed:", error);
    return NextResponse.json(
      { error: "Unable to contact Adzuna right now. Please try again shortly." },
      { status: 502 },
    );
  }
}
