export async function POST(req: Request) {
  try {
    const { messages, interviewDetails, faceMeshFeedback } = await req.json();

    const model = "mistral";
    const systemPrompt = `
You are an expert AI recruiter and evaluation system.

Your task: Generate a **structured interview report strictly in RAW JSON format**.

### ⚠️ ABSOLUTE RULES:
- Output must be **raw JSON only** — no Markdown, no \`\`\`json, no text before or after.
- Output must start with **{** and end with **}**.
- Do NOT include any comments, explanations, or code blocks.
- Do NOT wrap or format JSON.
- Follow the **exact schema** below. Never change key names, nesting, or data types.
- Always include all fields, even if empty (use empty arrays or strings).
- Always return a valid JSON that can be parsed with JSON.parse().

### 📋 JSON Schema:
{
  "candidateInformation": {
    "candidateName": string,
    "jobRole": string,
    "difficulty": string,
    "mode": string,
    "numOfQuestions": number,
    "skillsAssessed": string
  },
  "answerAnalysis": {
    "candidateAnswersSummary": string,
    "strengths": string[],
    "weaknesses": string[],
    "communicationStyle": string,
    "problemSolvingApproach": string,
    "insights": string[]
  },
  "facialAnalytics": {
    "confidence": string,
    "nervousness": string,
    "emotionSummary": string,
    "notes": string
  },
  "overallPerformance": {
    "summary": string,
    "justification": string
  },
  "summaryAndNextSteps": {
    "finalSummary": string,
    "rationale": string[],
    "actionableNextSteps": string[]
  },
  "scores": {
    "technicalKnowledge": number,   // out of 10
    "communication": number,        // out of 10
    "problemSolving": number,       // out of 10
    "confidenceLevel": number,      // out of 10
    "engagement": number,           // out of 10
    "composure": number,            // out of 10
    "overall": number,              // out of 10
    "potentialFit": number          // out of 10
  }
}

### ⚙️ Edge Case Handling Rules:
- If candidate skipped or gave no answers, set all textual analysis fields to short neutral statements like "No valid response provided."
- If facial data is missing or unclear, set all facial analytics fields to "Not detected" and scores to 0–3.
- Always ensure numeric scores are integers between 0 and 10.
- Always include candidate name exactly as provided in the input.
- If data is incomplete, still output the same schema with best-effort analysis.

### ✅ Style & Quality:
- Keep all text short, professional, and clear.
- Ensure language is neutral and assessment-like (HR tone).
- Avoid redundancy — each insight must add value.

Return **only** the JSON in the exact structure above.
`;

    const API_URI = "https://gen.pollinations.ai/v1/chat/completions";
    const response = await fetch(API_URI, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_API_TOKEN_POLLINATIONS}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              candidateName: interviewDetails?.username || "N/A",
              interviewDetails,
              messages,
              facialAnalytics: faceMeshFeedback,
            }),
          },
        ],
      }),
    });

    const data = await response.json();

    let content = data?.choices?.[0]?.message?.content?.trim() || "";

    if (content.startsWith("```")) {
      content = content.replace(/```json\s*|\s*```/g, "").trim();
    }

    console.log("Generated Report:", content);
    return new Response(content, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate report" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
