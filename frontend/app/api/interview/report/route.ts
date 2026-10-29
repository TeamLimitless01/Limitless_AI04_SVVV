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

type AnswerFeedback = {
  answerMessageIndex: number;
  observation: string;
  nextStep: string;
  evidenceQuote: string;
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
  answerFeedback: AnswerFeedback[];
};

const defaultMetricDefinitions: Record<MetricId, { label: string; weight: number }> = {
  roleKnowledge: { label: "Role knowledge and application", weight: 0.4 },
  problemSolving: { label: "Reasoning and problem solving", weight: 0.35 },
  communication: { label: "Communication and clarity", weight: 0.25 },
};

const getMetricDefinitions = (mode: unknown): Record<MetricId, { label: string; weight: number }> => {
  if (typeof mode === "string" && mode.toLocaleLowerCase().startsWith("hr")) {
    return {
      roleKnowledge: { label: "Behavioral evidence and relevance", weight: 0.4 },
      problemSolving: { label: "Judgment, reflection, and actions", weight: 0.35 },
      communication: { label: "Communication and clarity", weight: 0.25 },
    };
  }
  return {
    roleKnowledge: { label: "Technical knowledge and application", weight: 0.4 },
    problemSolving: { label: "Technical reasoning and tradeoffs", weight: 0.35 },
    communication: { label: "Communication and clarity", weight: 0.25 },
  };
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
  transcript: TranscriptMessage[],
  questionAnswerPairs: {
    questionMessageIndex: number | null;
    answerMessageIndex: number;
  }[]
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
    !isRecord(metrics) ||
    !Array.isArray(value.answerFeedback)
  ) {
    return false;
  }

  const validMetrics = (Object.keys(defaultMetricDefinitions) as MetricId[]).every(
    (metricId) => validateMetric(metrics[metricId], transcript)
  );
  if (!validMetrics) return false;

  const eligibleAnswerIndexes = new Set(
    questionAnswerPairs
      .filter((pair) => pair.questionMessageIndex !== null)
      .map((pair) => pair.answerMessageIndex)
  );
  const seenAnswerIndexes = new Set<number>();

  return value.answerFeedback.every((item) => {
    if (
      !isRecord(item) ||
      !Number.isInteger(item.answerMessageIndex) ||
      typeof item.observation !== "string" ||
      !item.observation.trim() ||
      item.observation.length > 500 ||
      typeof item.nextStep !== "string" ||
      !item.nextStep.trim() ||
      item.nextStep.length > 500 ||
      typeof item.evidenceQuote !== "string" ||
      item.evidenceQuote.trim().length < 8
    ) {
      return false;
    }

    const answerIndex = item.answerMessageIndex as number;
    const answer = transcript[answerIndex];
    if (
      !eligibleAnswerIndexes.has(answerIndex) ||
      seenAnswerIndexes.has(answerIndex) ||
      answer?.role !== "user" ||
      !normalizeQuote(answer.content).includes(normalizeQuote(item.evidenceQuote))
    ) {
      return false;
    }

    seenAnswerIndexes.add(answerIndex);
    return true;
  });
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
    const metricDefinitions = getMetricDefinitions(interviewDetails.mode);
    const isHrInterview =
      typeof interviewDetails.mode === "string" &&
      interviewDetails.mode.toLocaleLowerCase().startsWith("hr");
    const interviewDifficulty =
      typeof interviewDetails.difficulty === "string"
        ? interviewDetails.difficulty.toLocaleLowerCase()
        : "medium";
    const tabSwitchCount =
      typeof requestBody.tabSwitchCount === "number" && Number.isFinite(requestBody.tabSwitchCount)
        ? Math.max(0, Math.floor(requestBody.tabSwitchCount))
        : 0;
    const questionAnswerPairs = transcript.flatMap((message, answerMessageIndex) => {
      if (message.role !== "user") return [];
      let questionMessageIndex = answerMessageIndex - 1;
      while (questionMessageIndex >= 0 && transcript[questionMessageIndex].role !== "assistant") {
        questionMessageIndex -= 1;
      }
      return [{
        questionMessageIndex: questionMessageIndex >= 0 ? questionMessageIndex : null,
        answerMessageIndex,
      }];
    });

    const systemPrompt = `
You are an impartial coach evaluating a ${isHrInterview ? "behavioral HR" : "role-specific technical"} mock interview. Your goal is a fair, useful assessment—not to reward or punish the candidate and not to force scores toward the middle.
Target interview difficulty: ${interviewDifficulty}. Apply the stated difficulty anchors to the questions actually asked.

## SCORING SCALE
Rate each assessable metric with an integer from 0 to 4. Calibrate to the stated interview difficulty:
- 0 = The candidate gave an assessable response, but it does not address the question or contains no relevant demonstrated evidence.
- 1 = Very limited evidence; the response is mostly off-target, materially mistaken, or unsupported.
- 2 = Partial evidence; some relevant understanding or reasoning is present, alongside meaningful gaps.
- 3 = Solid evidence for this role and difficulty; the answer is relevant and substantially sound, with adequate reasoning or support.
- 4 = Strong, well-supported evidence that meets the expected level particularly well; do not require a flawless or unusually long answer.
Use null (with no evidence) when the metric genuinely was not tested or the transcript is too unclear to assess fairly. Do not use 0 as a substitute for missing evidence.

Difficulty calibration: "easy" expects foundational accuracy; "medium" expects sound applied understanding; "hard" expects deeper reasoning and trade-offs. Difficulty changes the expected depth, not the candidate's worth or the evaluator's severity. Judge the answer against the level actually asked, not an ideal answer to a harder question.

Metric definitions:
- roleKnowledge: ${isHrInterview
  ? "behavioral evidence and relevance: assess examples actually requested, the candidate's own contribution, and relevance to the stated role. Do not score technical knowledge."
  : "role knowledge and application: assess correctness and relevance of answers to the questions asked, using the stated role and skills. Do not assume every role is a software role or penalize untested skills."}
- problemSolving: ${isHrInterview
  ? "judgment, reflection, and actions: assess the reasoning and choices shown in examples the candidate was asked to discuss; do not demand a particular storytelling framework."
  : "reasoning and problem solving: assess the coherence of the approach and any relevant constraints or trade-offs actually explored in the interview."}
- communication: assess whether the response is understandable and sufficiently organized for its substance. Concision is not a weakness. Do not score accent, grammar unless it impedes understanding, personality, confidence, emotion, pauses, camera presence, or speaking speed.

## ASSESSMENT METHOD
- Evaluate each candidate answer together with the paired preceding interviewer turn in questionAnswerPairs, using the indices to find both messages in messages. Ignore greetings, acknowledgements, small talk, and interviewer statements that are not questions. If a pair has no meaningful question, do not infer what the candidate was expected to answer.
- Consider the full set of assessable answers for each metric. Do not let one weak or strong answer automatically determine the whole metric; weigh the consistency and relevance of evidence across the interview.
- Use the stated role, skills, mode, and difficulty as context. Do not require knowledge outside the asked questions or selected focus. The resume is context for question relevance only, never proof of candidate competence.
- Treat likely speech-to-text errors conservatively. Score only the meaning that is reasonably clear; do not infer missing technical details or penalize garbled transcription as poor communication. If the answer cannot be interpreted well enough for a metric, use null for that metric.
- Assess only candidate (user) messages, using their zero-based index in the full messages array.
- For every numeric rating, include at least one exact, contiguous quote copied from a relevant candidate answer. Do not invent, paraphrase, or alter quotes. Include more than one quote only when multiple answers materially support the metric.
- Also provide answerFeedback for each meaningful question-answer pair. Use the zero-based answerMessageIndex from questionAnswerPairs, a concise evidence-based observation, one practical nextStep, and an exact contiguous evidenceQuote copied from that answer (at least 8 characters). Do not provide per-answer scores; the existing three metrics are the only scored dimensions. Skip exchanges that are greetings, acknowledgements, small talk, or do not contain a meaningful question. When transcription is too unclear to support a judgment, say so neutrally and do not infer ability.
- A null rating must have no evidence. Do not infer from unanswered or unasked questions.
- Every strength, weakness, insight, rationale, and next step must be supported by the transcript and align with the metric ratings. Do not invent facts, competencies, or answer content.
- Explain the rating with specific demonstrated evidence and realistic next steps; distinguish a true knowledge gap from an area the interview did not test.
- The overall summary must be a concise synthesis of the assessed metrics, not a hiring decision. Recommendations must address evidenced gaps.
- Mention the provided tab switch count neutrally in overallJustification only when it is greater than zero. It is not a performance metric and must not affect any rating.
- Use respectful, neutral language. Never inflate or deflate scores to satisfy a target distribution.
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
                answerFeedback: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      answerMessageIndex: { type: "integer", minimum: 0 },
                      observation: { type: "string", minLength: 1, maxLength: 500 },
                      nextStep: { type: "string", minLength: 1, maxLength: 500 },
                      evidenceQuote: { type: "string", minLength: 8 },
                    },
                    required: [
                      "answerMessageIndex",
                      "observation",
                      "nextStep",
                      "evidenceQuote",
                    ],
                    additionalProperties: false,
                  },
                },
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
                "answerFeedback",
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
              questionAnswerPairs,
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

    if (!validateGeneratedAnalysis(generated, transcript, questionAnswerPairs)) {
      console.error("Report provider returned unsupported or invalid assessment data");
      return Response.json({ error: "The report could not be validated against the transcript. Please retry." }, { status: 502 });
    }

    const metrics = generated.metrics;
    const scores = {
      roleKnowledge: metrics.roleKnowledge.rating === null ? null : metrics.roleKnowledge.rating * 2.5,
      problemSolving: metrics.problemSolving.rating === null ? null : metrics.problemSolving.rating * 2.5,
      communication: metrics.communication.rating === null ? null : metrics.communication.rating * 2.5,
    };
    const assessedMetricIds = (Object.keys(metricDefinitions) as MetricId[]).filter(
      (metricId) => metrics[metricId].rating !== null
    );
    const assessedWeight = assessedMetricIds.reduce(
      (total, metricId) => total + metricDefinitions[metricId].weight,
      0
    );
    const assessedWeightPercent = Math.round(assessedWeight * 100);
    const overall =
      assessedMetricIds.length < 2
        ? null
        : Number(
            (
              assessedMetricIds.reduce(
                (total, metricId) =>
                  total +
                  (metrics[metricId].rating as number) *
                    metricDefinitions[metricId].weight,
                0
              ) /
                assessedWeight *
                2.5
            ).toFixed(1)
          );

    const report = {
      candidateInformation: {
        candidateName,
        jobRole: interviewDetails.topic || "N/A",
        interviewType: isHrInterview ? "HR / behavioral" : "Technical",
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
        answerFeedback: generated.answerFeedback.flatMap((feedback) => {
          const pair = questionAnswerPairs.find(
            (item) => item.answerMessageIndex === feedback.answerMessageIndex
          );
          if (pair?.questionMessageIndex == null) return [];

          return [{
            question: transcript[pair.questionMessageIndex].content,
            answerMessageIndex: feedback.answerMessageIndex,
            observation: feedback.observation,
            nextStep: feedback.nextStep,
            evidenceQuote: feedback.evidenceQuote,
          }];
        }),
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
        rubricVersion: "1.2",
        scale: "0-4; metric scores are multiplied by 2.5 to convert to a 0-10 scale",
        weighting: metricDefinitions,
        metrics,
        assessedMetricCount: assessedMetricIds.length,
        totalMetricCount: Object.keys(metricDefinitions).length,
        assessedWeightPercent,
        overallFormula: assessedMetricIds.length < 2
          ? "An overall score requires at least two assessable metrics."
          : "(sum of assessed metric ratings × their weights / sum of assessed metric weights) × 2.5",
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
