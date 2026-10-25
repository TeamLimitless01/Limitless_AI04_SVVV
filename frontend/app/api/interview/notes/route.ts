import { NextResponse } from "next/server";

type TranscriptMessage = {
  role: "assistant" | "user";
  content: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasEnoughTranscript = (messages: TranscriptMessage[]) => {
  const substantialMessages = messages.filter((message) => message.content.trim().length >= 15);
  const interviewerTurns = substantialMessages.filter((message) => message.role === "assistant").length;
  const candidateTurns = substantialMessages.filter((message) => message.role === "user").length;
  const transcriptLength = substantialMessages.reduce(
    (total, message) => total + message.content.trim().length,
    0,
  );
  return interviewerTurns >= 2 && candidateTurns >= 2 && transcriptLength >= 180;
};


export async function POST(req: Request) {
  try {
    const requestBody: unknown = await req.json();
    if (!isRecord(requestBody) || !Array.isArray(requestBody.messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const messages = requestBody.messages.filter(
      (message): message is TranscriptMessage =>
        isRecord(message) &&
        (message.role === "assistant" || message.role === "user") &&
        typeof message.content === "string",
    );
    if (messages.length !== requestBody.messages.length) {
      return NextResponse.json(
        { error: "Each message must include a valid role and text content." },
        { status: 400 },
      );
    }
    if (!hasEnoughTranscript(messages)) {
      return NextResponse.json(
        { error: "Complete at least two interview questions and answers before generating improvements." },
        { status: 422 },
      );
    }

    const interviewDetails = isRecord(requestBody.interviewDetails) ? requestBody.interviewDetails : {};
    const getDetail = (key: string, fallback: string) => {
      const value = interviewDetails[key];
      return typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : fallback;
    };
    const transcript = messages
      .map((message) => `${message.role === "assistant" ? "Interviewer" : "Candidate"}: ${message.content.trim()}`)
      .join("\n");

    const model = 'openai/gpt-6-luna'; // Using the standard AI model for this project
    const API_URI = "https://gen.pollinations.ai/v1/chat/completions";

    const prompt = `
You are an expert technical interviewer and career coach. Review the following interview transcript from a recent ${getDetail("mode", "Technical")} interview for the role of ${getDetail("topic", "Candidate")} focusing on ${getDetail("skills", "General Skills")}.

INTERVIEW TRANSCRIPT:
${transcript}

TASK:
Identify ONLY the core interview questions asked by the AI. Ignore greetings, small talk, and general chatter.
For each actual interview question asked by the AI, extract the candidate's core response and generate comprehensive study notes.

IMPORTANT: Translate all questions, candidate responses, and notes into plain ENGLISH. The entire JSON response MUST be exclusively in English, as it will be rendered in a basic PDF that does not support special unicode characters.

Provide:
1. The question itself (translated to English if necessary).
2. A summarized version of the candidate's actual answer to this question (translated to English). If skipped, state "No relevant answer provided."
3. 3-4 key points or concepts that a strong candidate should mention in an ideal answer.
4. A concise summary of an ideal answer.

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure, with no markdown code blocks or extra text:
{
  "notes": [
    {
      "question": "string",
      "candidate_answer": "string",
      "key_points": ["string format list"],
      "suggested_answer_summary": "string"
    }
  ]
}
`;

    const upstreamResponse = await fetch(API_URI, {
      method: "POST",
      headers: {
        Authorization: `Bearer sk_EAH7ZUybK4BpBtT4q2KEltJks5uxzZZX`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.2, // Low temperature for more deterministic JSON output
        messages: [
          {
            role: "system",
            content: "You are a helpful JSON generation assistant. Always return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!upstreamResponse.ok) {
      const err = await upstreamResponse.text();
      console.error("Upstream error:", err);
      return NextResponse.json({ error: "Upstream AI failed" }, { status: 502 });
    }

    const data = await upstreamResponse.json();
    let rawContent = data.choices?.[0]?.message?.content || "";

    // Cleanup JSON markdown if it exists
    rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedNotes = JSON.parse(rawContent);

    return NextResponse.json(parsedNotes);
  } catch (error) {
    console.error("Notes API Error:", error);
    return NextResponse.json(
      { error: "Could not generate notes" },
      { status: 500 }
    );
  }
}
