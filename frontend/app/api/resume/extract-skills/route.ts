import { NextRequest, NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";
import AdmZip from "adm-zip";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.NEXT_PUBLIC_SARVAM_API_KEY || "sk_1nabhvxz_X6kklK1eY0ukPImYdg0lvJsd",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid or no PDF file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`Sending resume to Sarvam Document Parse: ${file.name}`);

    // Create a document intelligence job using Sarvam AI like summarize-quiz
    const job = await client.documentIntelligence.createJob({
      language: "en-IN",
      outputFormat: "html",
    });

    //@ts-ignore
    await job.uploadFile(buffer, file.name);
    await job.start();

    const status = await job.waitUntilComplete();
    if (status.job_state !== "Completed") {
      throw new Error(`Job failed with state: ${status.job_state}`);
    }

    // ✅ Download output to memory
    const downloadResponse = await job.getDownloadLinks();
    const downloadUrls = downloadResponse.download_urls;

    if (!downloadUrls || Object.keys(downloadUrls).length === 0) {
      throw new Error("No download URLs available from Sarvam AI");
    }

    const downloadInfo = Object.values(downloadUrls)[0] as any;
    const fileUrl = downloadInfo?.file_url;

    if (!fileUrl) {
      throw new Error("Invalid download URL");
    }

    const zipResponse = await fetch(fileUrl);
    if (!zipResponse.ok) {
      throw new Error(`Failed to download ZIP: ${zipResponse.statusText}`);
    }

    const zipBuffer = Buffer.from(await zipResponse.arrayBuffer());

    // Extract the text using Adm-Zip from buffer
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    let resumeText = "";

    zipEntries.forEach((entry: any) => {
      if (!entry.isDirectory && (entry.entryName.endsWith('.html') || entry.entryName.endsWith('.txt'))) {
        resumeText += entry.getData().toString('utf8') + "\n";
      }
    });

    // Strip rough HTML tags to lower token count
    resumeText = resumeText.replace(/<[^>]*>?/gm, ' ');

    // Use Sarvam AI model natively to extract Skills, Summary, and Improvements
    const prompt = `
You are an expert tech recruiter and career coach scanning a candidate's resume.
Review the resume text below and provide a concise professional evaluation.

RESUME TEXT:
${resumeText.substring(0, 15000)}

TASK:
Return ONLY a valid JSON object matching EXACTLY this structure:
{
  "skills": ["top 5-10 technical/professional skill strings"],
  "summary": "a 2-3 sentence professional summary of the candidate's profile",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "jobRole": "the target role derived from resume (e.g. Senior Frontend Engineer)",
  "suggestedDifficulty": "easy" | "medium" | "hard",
  "suggestedMode": "Technical" | "HR",
  "candidateName": "the name of the person if identifiable"
}

RULES:
1. Extract only clear, distinct skills.
2. The summary should be impactful and highlight seniority/specialization.
3. Improvements should be specific to the resume (e.g., 'Add more quantitative metrics', 'Focus more on React hooks in projects section').
4. Return ABSOLUTELY NO OTHER TEXT, just the raw JSON.
`;

    const apiRes = await fetch("https://api.sarvam.ai/v2/chat/completions", {
      method: "POST",
      headers: {
        "api-subscription-key": process.env.SARVAM_API_KEY || "sk_1nabhvxz_X6kklK1eY0ukPImYdg0lvJsd",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sarvam-105b",
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "resume_extraction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                skills: {
                  type: "array",
                  items: { type: "string" },
                },
                summary: { type: "string" },
                improvements: {
                  type: "array",
                  items: { type: "string" },
                },
                jobRole: { type: "string" },
                suggestedDifficulty: { type: "string" },
                suggestedMode: { type: "string" },
                candidateName: { type: "string" },
              },
              required: ["skills", "summary", "improvements", "jobRole", "suggestedDifficulty", "suggestedMode", "candidateName"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      throw new Error(`Sarvam API ${apiRes.status}: ${errBody}`);
    }

    const data = await apiRes.json();
    const content = data.choices?.[0]?.message?.content; // guaranteed JSON string from v2
    
    let parsedResponse: any = {};
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseErr) {
      console.error("JSON parse error — raw content:", content);
      throw new Error("Failed to parse LLM response as JSON");
    }

    return NextResponse.json({
      success: true,
      skills: parsedResponse.skills || [],
      summary: parsedResponse.summary || "No summary available.",
      improvements: parsedResponse.improvements || [],
      jobRole: parsedResponse.jobRole || "",
      suggestedDifficulty: parsedResponse.suggestedDifficulty || "medium",
      suggestedMode: parsedResponse.suggestedMode || "Technical",
      candidateName: parsedResponse.candidateName || ""
    });

  } catch (error) {
    console.error("Error processing Resume PDF:", error);
    return NextResponse.json(
      { error: "Failed to extract skills", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
