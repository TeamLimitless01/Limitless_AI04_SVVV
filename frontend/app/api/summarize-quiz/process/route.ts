import { NextRequest, NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY || "sk_1nabhvxz_X6kklK1eY0ukPImYdg0lvJsd",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF file." },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save the uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, file.name);
    await writeFile(filePath, buffer);

    console.log(`File saved to: ${filePath}`);

    // Create a document intelligence job
    const job = await client.documentIntelligence.createJob({
      language: "en-IN",
      outputFormat: "html",
    });

    console.log(`Job created: ${job.jobId}`);

    // Upload document
    await job.uploadFile(filePath);
    console.log("File uploaded");

    // Start processing
    await job.start();
    console.log("Job started");

    // Wait for completion
    const status = await job.waitUntilComplete();
    console.log(`Job completed with state: ${status.job_state}`);

    if (status.job_state !== "Completed") {
      throw new Error(`Job failed with state: ${status.job_state}`);
    }

    // Get processing metrics
    const metrics = job.getPageMetrics();
    console.log("Page metrics:", metrics);

    // Download output (ZIP file containing the processed document)
    const outputPath = join(uploadsDir, `output_${job.jobId}.zip`);
    await job.downloadOutput(outputPath);
    console.log("Output saved to:", outputPath);

    // For now, we'll create a mock summary since we need to extract and process the HTML
    // In a real implementation, you would extract the HTML from the ZIP and process it
    const mockSummary = `This document contains comprehensive notes on various topics. The content has been processed and analyzed using Sarvam AI's document intelligence. Key concepts and important information have been extracted to provide you with this summary. The original document maintains its structure and formatting while being made searchable and accessible through AI processing.`;

    // Clean up the uploaded file
    try {
      const fs = require("fs");
      fs.unlinkSync(filePath);
      fs.unlinkSync(outputPath);
    } catch (error) {
      console.error("Error cleaning up files:", error);
    }

    return NextResponse.json({
      success: true,
      summary: mockSummary,
      jobId: job.jobId,
      metrics: metrics,
    });

  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { 
        error: "Failed to process PDF",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
