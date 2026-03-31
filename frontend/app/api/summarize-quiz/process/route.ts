import { NextRequest, NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";
import JSZip from "jszip";
import { JSDOM } from "jsdom";
import { tmpdir } from "os";
import { join } from "path";
import { readFile, unlink } from "fs/promises";
import axios from "axios";
const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY!, //
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    console.log("Received file:", file?.name, file?.size);

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ✅ Step 1: Create job
    const job = await client.documentIntelligence.createJob({
      language: "en-IN",
      outputFormat: "html",
    });

    console.log("Job created:", job.jobId);

    // ✅ Step 2: Upload file
    const buffer = Buffer.from(await file.arrayBuffer());
    //@ts-ignore
    await job.uploadFile(buffer, file?.name);

    console.log("File uploaded:", file.name);

    // ✅ Step 3: Start job
    await job.start();

    // ✅ Step 4: Wait for completion
    const status = await job.waitUntilComplete();
    console.log("Job status:", status.job_state);

    // ✅ Step 5: Download ZIP to temp file (FIXED 🔥)
    const tempPath = join(tmpdir(), `output-${Date.now()}.zip`);

    await job.downloadOutput(tempPath);

    const zipBuffer = await readFile(tempPath);

    console.log("ZIP downloaded:", zipBuffer.byteLength);

    // 🧹 Cleanup temp file
    await unlink(tempPath);

    // ✅ Step 6: Extract HTML from ZIP
    const zip = await JSZip.loadAsync(zipBuffer);

    console.log("ZIP loaded:", Object.keys(zip.files).length);

    let htmlContent = "";

    for (const fileName of Object.keys(zip.files)) {
      if (fileName.endsWith(".html")) {
        htmlContent = await zip.files[fileName].async("text");
        break;
      }
    }

    if (!htmlContent) {
      throw new Error("No HTML content found in output");
    }

    console.log("HTML extracted");

    // ✅ Step 7: Convert HTML → text
    const dom = new JSDOM(htmlContent);
    const cleanText = dom.window.document.body.textContent || "";

    console.log(
      "Text length:......................................",
      cleanText.length,
    );

    const limitedText = cleanText.slice(0, 12000);

    const API_URI = "https://api.sarvam.ai/v1/chat/completions";

    const response = await fetch(API_URI, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SARVAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sarvam-105b", // 🔥 or check latest models
        messages: [
          {
            role: "system",
            content:
              "Summarize clearly in bullet points. and summarize in 150 to 200 words only don't use more then 200 words. return only the summary don't return anything else and unwanted text, also don't return any introductory or concluding text. don't include any text other than the summary.  don't include ai speech, return only pure summary.",
          },
          {
            role: "user",
            content: limitedText,
          },
        ],
        temperature: 0.3,
      }),
    });

    // ❗ handle API failure
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam API Error:", errorText);
      throw new Error("Sarvam API failed");
    }

    const data = await response.json();

    console.log("Sarvam response:", data);

    // ✅ correct parsing
    const summary =
      data?.choices?.[0]?.message?.content || "No summary generated";

    return NextResponse.json({
      summary,
    });
  } catch (err) {
    console.error("ERROR:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
