import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("file") as Blob;
    const model = formData.get("model") as string || "saaras:v3";
    const language = formData.get("language") as string || "en-IN";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const sarvamFormData = new FormData();
    sarvamFormData.append("file", audioFile, "audio.webm");
    sarvamFormData.append("model", model);
    sarvamFormData.append("mode", "transcribe");
    // Sarvam Saaras v3 handles language detection automatically if not specified, 
    // but we can pass a hint if needed. Saaras v3 doesn't have a direct 'language' param for transcribe mode in the same way, 
    // but the model itself is optimized for Indian languages.

    const response = await fetch("https://api.sarvam.ai/v1/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": process.env.SARVAM_API_KEY || "",
      },
      body: sarvamFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam STT Error:", errorText);
      return NextResponse.json({ error: "Failed to transcribe audio", details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("STT Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
