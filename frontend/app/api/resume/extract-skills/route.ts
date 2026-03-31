import { NextRequest, NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import AdmZip from "adm-zip";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY || "sk_1nabhvxz_X6kklK1eY0ukPImYdg0lvJsd",
});

export async function POST(request: NextRequest) {
  let filePath = "";
  let outputPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Invalid or no PDF file provided" }, { status: 400 });
    }

    const uploadsDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    filePath = join(uploadsDir, `resume_${Date.now()}.pdf`);
    await writeFile(filePath, Buffer.from(bytes));

    console.log(`Sending resume to Sarvam Document Parse: ${filePath}`);

    // Create a document intelligence job using Sarvam AI like summarize-quiz
    const job = await client.documentIntelligence.createJob({
      language: "en-IN",
      outputFormat: "html",
    });

    await job.uploadFile(filePath);
    await job.start();

    const status = await job.waitUntilComplete();
    if (status.job_state !== "Completed") {
      throw new Error(`Job failed with state: ${status.job_state}`);
    }

    outputPath = join(uploadsDir, `resume_out_${job.jobId}.zip`);
    await job.downloadOutput(outputPath);

    // Extract the text using Adm-Zip
    const zip = new AdmZip(outputPath);
    const zipEntries = zip.getEntries();
    let resumeText = "";

    zipEntries.forEach((entry: any) => {
      if (!entry.isDirectory && (entry.entryName.endsWith('.html') || entry.entryName.endsWith('.txt'))) {
        resumeText += entry.getData().toString('utf8') + "\n";
      }
    });

    // Strip rough HTML tags to lower token count
    resumeText = resumeText.replace(/<[^>]*>?/gm, ' ');

    // Use Sarvam AI model natively to extract Skills
    const prompt = `
You are an expert tech recruiter scanning a candidate's resume.
Extract the top core professional and technical skills from the following resume text.
Only extract clear, distinct skills (e.g. "React", "Python", "Data Analysis", "Project Management").

RESUME TEXT:
${resumeText.substring(0, 15000)}

TASK:
Return ONLY a valid JSON object matching exactly this structure containing a list of strings:
{
  "skills": ["skill1", "skill2"]
}
Limit to maximum top 5-10 most important skills that will be usefull to get a job no unrelated texts. Return absolutely no other text, just the raw JSON.
`;

    const apiRes = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SARVAM_API_KEY || "sk_1nabhvxz_X6kklK1eY0ukPImYdg0lvJsd"}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sarvam-105b",
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }]
      }),
    });

    if (!apiRes.ok) throw new Error("LLM Skill Extraction Failed");

    const data = await apiRes.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*|\s*```/g, "").trim();

    const parsedSkills = JSON.parse(content);

    return NextResponse.json({ success: true, skills: parsedSkills.skills || [] });

  } catch (error) {
    console.error("Error processing Resume PDF:", error);
    return NextResponse.json(
      { error: "Failed to extract skills", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  } finally {
    // Cleanup generated files
    try {
      if (filePath && existsSync(filePath)) await unlink(filePath);
      if (outputPath && existsSync(outputPath)) await unlink(outputPath);
    } catch (e) {
      console.error("Cleanup failed:", e);
    }
  }
}
