export async function POST(req: Request) {
  try {
    const { messages, interviewDetails, tabSwitchCount } = await req.json();

    const model = "openai/gpt-6-luna";
    const systemPrompt = `
You are an expert AI recruiter and evaluation system.

Your task: Generate a **structured interview report strictly in RAW JSON format**.

### 🚥 INTEGRITY:
- You will receive a 'tabSwitchCount' indicating how many times the candidate switched tabs or lost focus during the interview.
- If 'tabSwitchCount' is greater than 0, mention it neutrally in 'overallPerformance.justification'.
- Base assessments only on the interview answers and provided interview details. Do not infer or evaluate facial expressions, confidence, emotion, engagement, composure, or camera presence.

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
    "interviewTime": number, // duration in minutes
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
    "overall": number,              // out of 10
    "potentialFit": number          // out of 10
  }
}

### ⚙️ Edge Case Handling Rules:
- If candidate skipped or gave no answers, set all textual analysis fields to short neutral statements like "No valid response provided."
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
        Authorization: `Bearer sk_EAH7ZUybK4BpBtT4q2KEltJks5uxzZZX`,
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
              integrityViolations: tabSwitchCount || 0,
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
