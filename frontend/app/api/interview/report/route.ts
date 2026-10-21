type TranscriptMessage = {
  role: "assistant" | "user";
  content: string;
};

type MetricId = "roleKnowledge" | "problemSolving" | "communication";

type MetricEvidence = {
  messageIndex: number;
  quote: string;
};

type MetricAssessment = {
  rating: number | null;
  evidence: MetricEvidence[];
};

type GeneratedAnalysis = {
  candidateAnswersSummary: string;
  strengths: string[];
  weaknesses: string[];
  communicationStyle: string;
  problemSolvingApproach: string;
  insights: string[];
  overallSummary: string;
  overallJustification: string;
  finalSummary: string;
  rationale: string[];
  actionableNextSteps: string[];
  metrics: Record<MetricId, MetricAssessment>;
};

const metricDefinitions: Record<MetricId, { label: string; weight: number }> = {
  roleKnowledge: { label: "Role knowledge and application", weight: 0.4 },
  problemSolving: { label: "Reasoning and problem solving", weight: 0.35 },
  communication: { label: "Communication and clarity", weight: 0.25 },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const normalizeQuote = (value: string) =>
  value.toLocaleLowerCase().replace(/\s+/g, " ").trim();

const validateMetric = (
  value: unknown,
  transcript: TranscriptMessage[]
): value is MetricAssessment => {
  if (!isRecord(value) || !Array.isArray(value.evidence)) {
    return false;
  }

  if (value.rating === null) return value.evidence.length === 0;
  if (!Number.isInteger(value.rating) || (value.rating as number) < 0 || (value.rating as number) > 4) {
    return false;
  }
  if (value.evidence.length === 0) return false;

  return value.evidence.every((item) => {
    if (!isRecord(item) || !Number.isInteger(item.messageIndex) || typeof item.quote !== "string") {
      return false;
    }
    const sourceMessage = transcript[item.messageIndex as number];
    return (
      sourceMessage?.role === "user" &&
      item.quote.trim().length >= 8 &&
      normalizeQuote(sourceMessage.content).includes(normalizeQuote(item.quote))
    );
  });
};

const validateGeneratedAnalysis = (
  value: unknown,
  transcript: TranscriptMessage[]
): value is GeneratedAnalysis => {
  if (!isRecord(value)) return false;

  const stringFields = [
    "candidateAnswersSummary",
    "communicationStyle",
    "problemSolvingApproach",
    "overallSummary",
    "overallJustification",
    "finalSummary",
  ];
  if (stringFields.some((field) => typeof value[field] !== "string")) return false;
  const metrics = value.metrics;
  if (
    !isStringArray(value.strengths) ||
    !isStringArray(value.weaknesses) ||
    !isStringArray(value.insights) ||
    !isStringArray(value.rationale) ||
    !isStringArray(value.actionableNextSteps) ||
    !isRecord(metrics)
  ) {
    return false;
  }

  return (Object.keys(metricDefinitions) as MetricId[]).every((metricId) =>
    validateMetric(metrics[metricId], transcript)
  );
};

export async function POST(req: Request) {
  try {
    const requestBody: unknown = await req.json();
    if (!isRecord(requestBody) || !Array.isArray(requestBody.messages)) {
      return Response.json({ error: "A valid interview transcript is required." }, { status: 400 });
    }

    const transcript = requestBody.messages.filter(
      (message): message is TranscriptMessage =>
        isRecord(message) &&
        (message.role === "assistant" || message.role === "user") &&
        typeof message.content === "string"
    );
    if (transcript.length !== requestBody.messages.length) {
      return Response.json({ error: "The interview transcript has an invalid message." }, { status: 400 });
    }

    const candidateAnswers = transcript.filter((message) => message.role === "user");
    if (candidateAnswers.length === 0) {
      return Response.json(
        { error: "There are no candidate answers to assess, so a scored report cannot be generated." },
        { status: 422 }
      );
    }

    const interviewDetails = isRecord(requestBody.interviewDetails) ? requestBody.interviewDetails : {};
    const candidateName =
      typeof interviewDetails.username === "string" ? interviewDetails.username : "N/A";
    const tabSwitchCount =
      typeof requestBody.tabSwitchCount === "number" && Number.isFinite(requestBody.tabSwitchCount)
        ? Math.max(0, Math.floor(requestBody.tabSwitchCount))
        : 0;

    const systemPrompt = `
You evaluate mock interview answers against a fixed evidence-based rubric.

Scoring standard (0–4 for each metric):
- Use null when there is no assessable answer; include no evidence for null.
- 0 = an assessable answer with no correct or relevant content.
- 1 = mostly incorrect or unsupported, but with limited relevant content.
- 2 = partially correct, with material gaps.
- 3 = substantially correct and sufficiently reasoned.
- 4 = accurate, relevant, and well-supported.

Metric definitions:
- roleKnowledge: correctness and relevance of knowledge for the stated role; adapt to the role and do not assume every role is technical.
- problemSolving: coherence of the approach, consideration of constraints, and support for decisions with reasoning.
- communication: clarity, organization, and specificity of the answer. Never score accent, personality, emotion, confidence, or camera presence.

Evidence and integrity:
- Assess only candidate (user) messages, using their zero-based index in the full messages array.
- For every numeric rating, include at least one exact, contiguous quote copied from that candidate message. Do not invent, paraphrase, or alter quotes.
- A null rating must have no evidence. Do not infer from unanswered questions.
- Every strength, weakness, insight, rationale, and next step must be supported by the transcript and align with the metric ratings. Do not invent facts, competencies, or answer content.
- The overall summary must be a concise synthesis of the supported metrics, not a hiring decision. Recommendations must address evidenced gaps.
- Mention the provided tab switch count neutrally in overallJustification only when it is greater than zero. It is not a performance metric and must not affect any rating.
- Use short, neutral, professional language.
`;

    const apiKey = process.env.AI_API_TOKEN_POLLINATIONS;
    if (!apiKey) {
      console.error("Report generation is missing the AI provider API token");
      return Response.json({ error: "The report service is not configured." }, { status: 500 });
    }

    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-luna",
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "evidence_based_interview_report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                candidateAnswersSummary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                weaknesses: { type: "array", items: { type: "string" } },
                communicationStyle: { type: "string" },
                problemSolvingApproach: { type: "string" },
                insights: { type: "array", items: { type: "string" } },
                overallSummary: { type: "string" },
                overallJustification: { type: "string" },
                finalSummary: { type: "string" },
                rationale: { type: "array", items: { type: "string" } },
                actionableNextSteps: { type: "array", items: { type: "string" } },
                metrics: {
                  type: "object",
                  properties: {
                    roleKnowledge: { $ref: "#/$defs/metric" },
                    problemSolving: { $ref: "#/$defs/metric" },
                    communication: { $ref: "#/$defs/metric" },
                  },
                  required: ["roleKnowledge", "problemSolving", "communication"],
                  additionalProperties: false,
                },
              },
              required: [
                "candidateAnswersSummary",
                "strengths",
                "weaknesses",
                "communicationStyle",
                "problemSolvingApproach",
                "insights",
                "overallSummary",
                "overallJustification",
                "finalSummary",
                "rationale",
                "actionableNextSteps",
                "metrics",
              ],
              additionalProperties: false,
              $defs: {
                metric: {
                  type: "object",
                  properties: {
                    rating: {
                      anyOf: [
                        { type: "integer", minimum: 0, maximum: 4 },
                        { type: "null" },
                      ],
                    },
                    evidence: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          messageIndex: { type: "integer", minimum: 0 },
                          quote: { type: "string", minLength: 8 },
                        },
                        required: ["messageIndex", "quote"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["rating", "evidence"],
                  additionalProperties: false,
                },
              },
            },
          },
        },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              candidateName,
              interviewDetails,
              messages: transcript,
              integrityViolations: tabSwitchCount,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Report provider returned an error", response.status);
      return Response.json({ error: "The report service is unavailable. Please retry." }, { status: 502 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!content) {
      console.error("Report provider returned an empty structured response");
      return Response.json({ error: "The report could not be generated. Please retry." }, { status: 502 });
    }

    let generated: unknown;
    try {
      generated = JSON.parse(content);
    } catch {
      console.error("Report provider returned invalid JSON");
      return Response.json({ error: "The report could not be validated. Please retry." }, { status: 502 });
    }

    if (!validateGeneratedAnalysis(generated, transcript)) {
      console.error("Report provider returned unsupported or invalid assessment data");
      return Response.json({ error: "The report could not be validated against the transcript. Please retry." }, { status: 502 });
    }

    const metrics = generated.metrics;
    const scores = {
      roleKnowledge: metrics.roleKnowledge.rating === null ? null : metrics.roleKnowledge.rating * 2.5,
      problemSolving: metrics.problemSolving.rating === null ? null : metrics.problemSolving.rating * 2.5,
      communication: metrics.communication.rating === null ? null : metrics.communication.rating * 2.5,
    };
    const roleKnowledgeRating = metrics.roleKnowledge.rating;
    const problemSolvingRating = metrics.problemSolving.rating;
    const communicationRating = metrics.communication.rating;
    const overall =
      roleKnowledgeRating === null ||
      problemSolvingRating === null ||
      communicationRating === null
        ? null
        : Number(
            (
              roleKnowledgeRating * metricDefinitions.roleKnowledge.weight * 2.5 +
              problemSolvingRating * metricDefinitions.problemSolving.weight * 2.5 +
              communicationRating * metricDefinitions.communication.weight * 2.5
            ).toFixed(1)
          );

    const report = {
      candidateInformation: {
        candidateName,
        jobRole: interviewDetails.topic || "N/A",
        difficulty: interviewDetails.difficulty || "N/A",
        mode: "audio",
        interviewTime: interviewDetails.interviewTime || 0,
        skillsAssessed: interviewDetails.skills || "",
      },
      answerAnalysis: {
        candidateAnswersSummary: generated.candidateAnswersSummary,
        strengths: generated.strengths,
        weaknesses: generated.weaknesses,
        communicationStyle: generated.communicationStyle,
        problemSolvingApproach: generated.problemSolvingApproach,
        insights: generated.insights,
      },
      overallPerformance: {
        summary: generated.overallSummary,
        justification: generated.overallJustification,
      },
      summaryAndNextSteps: {
        finalSummary: generated.finalSummary,
        rationale: generated.rationale,
        actionableNextSteps: generated.actionableNextSteps,
      },
      scorecard: {
        rubricVersion: "1.0",
        scale: "0-4; metric scores are multiplied by 2.5 to convert to a 0-10 scale",
        weighting: metricDefinitions,
        metrics,
        assessedMetricCount: Object.values(metrics).filter((metric) => metric.rating !== null).length,
        totalMetricCount: Object.keys(metricDefinitions).length,
        overallFormula: "(roleKnowledge × 0.40 + problemSolving × 0.35 + communication × 0.25) × 2.5",
      },
      scores: {
        ...scores,
        overall,
      },
    };

    return Response.json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    return Response.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
