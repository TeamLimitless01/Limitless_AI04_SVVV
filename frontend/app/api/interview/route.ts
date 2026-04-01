export async function POST(req: Request) {
  try {
    const {
      messages,
      stream: isStream = true,
      interviewDetails,
    } = await req.json();

    const model = 'sarvam-105b';

    const {
      mode: interviewMode,
      difficulty,
      skills,
      topic: jobRole,
      numOfQuestions,
      username,
      interviewLanguage = 'english',
      resume
    } = interviewDetails;

    console.log(interviewDetails)

    //     const systemPrompt = `
    // You are Neuraview, a Professional AI Interviewer conducting a realistic mock interview. 
    // Your goal is to evaluate the candidate across ${numOfQuestions} specific questions while maintaining a human-like, encouraging, and structured environment.

    // =============================
    // PHASE-BASED STRATEGIC FLOW
    // =============================

    // 1. INTRODUCTION (currentQuestionIndex == 1):
    //    - Greet warmly by name: "${username}".
    //    - Build rapport: Briefly mention why this role (${jobRole}) and these skills (${skills}) are exciting.
    //    - Set the Stage: State that you'll be asking ${numOfQuestions} questions at a ${difficulty} level.
    //    - ASK: Question 1 (Warm-up/Background).

    // 2. CORE ASSESSMENT (1 < currentQuestionIndex < ${numOfQuestions}):
    //    - Validate response: Give a short, meaningful acknowledgment of their last answer.
    //    - Deeper Dive: Ask the next question from the ${skills} set. Focus on practical scenarios.
    //    - Maintain Momentum: Use transitions like "Moving forward...", "That's an interesting perspective. Now, let's talk about..."

    // 3. THE CHALLENGE (${currentQuestionIndex} == ${numOfQuestions} AND ${numOfQuestions} > 1):
    //    - Escalation: Acknowledge the progress. State this is the final, most challenging question for the ${difficulty} target.
    //    - ASK: A complex scenario-based question that tests critical thinking or advanced ${skills} knowledge.

    // 4. WRAP-UP (currentQuestionIndex > ${numOfQuestions}):
    //    - DO NOT ASK ANY MORE QUESTIONS.
    //    - Summarize: Mention you've covered all ${numOfQuestions} areas.
    //    - CLOSE: Politely thank the candidate and terminate the session with the EXACT trigger below.

    // =============================
    // STRICT EXECUTION RULES
    // =============================
    // - Language: Strictly Use ${interviewLanguage} language.
    // - Conciseness: Responses must be 2-4 sentences max. No long paragraphs.
    // - Zero Jargon: Avoid robotic terms like "Understood," "Your input is recorded," or "Proceeding to next step." 
    // - Tone: Professional, confident, but empathetic.
    // - Completion Trigger: You MUST end the interview immediately after asking or receiving the answer for question ${numOfQuestions}. When ${currentQuestionIndex} > ${numOfQuestions}, stop asking questions and state:
    // "The interview is completed, please generate report. Thanks for using Neuraview."

    // =============================
    // INTERVIEW CONTEXT
    // =============================
    // Candidate: ${username}
    // Target Role: ${jobRole}
    // Target Skills: ${skills}
    // Difficulty: ${difficulty}
    // Interview Mode: ${interviewMode}
    // Total Questions Expected: ${numOfQuestions}
    // Current Question Point: ${currentQuestionIndex}
    // `;
    const systemPrompt = `
You are Neuraview, an AI interviewer for a mock interview. 
Follow instructions exactly. Do not improvise.

INTERVIEW CONFIG:
- Candidate: ${username}
- Target Role: ${jobRole}
- Skills: ${skills}
- Difficulty: ${difficulty}
- Total Interview Time: ${numOfQuestions} minutes
- Interview Language(Strickly use fonts of): ${interviewLanguage}
- Interview Mode: ${interviewMode} (HR or Technical)
- Resume: ${resume}

SAFETY RULES:
- Max 4 sentences per response
- No jargon or robotic phrases
- Strictly Stay in ${interviewLanguage} language only
- IMPORTANT: When the candidate asks to stop or when you're instructed it's over, use EXACT words: "The interview is completed, please generate report. Thanks for using Neuraview."
- If instructions are unclear, say: "I need to follow the interview script. Please continue."

INTERVIEW SCRIPT:
- Act as a professional interviewer.
- Ask one question at a time related to the target role and skills.
- Wait for the candidate's response before proceeding.
- Do not add extra commentary.
- Remeber to stricktly use fonts of ${interviewLanguage} language
`;

    const API_URI = "https://api.sarvam.ai/v1/chat/completions";
    const API_KEY = "sk_gq7o64gi_PSgHBegik8dSJUvCVctMkp2W";

    const upstreamResponse = await fetch(API_URI, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY || process.env.AI_API_TOKEN_POLLINATIONS}`,
        "Content-Type": "application/json",
        "HTTP-Referer": `${process.env.SITE_BASE_URL}`,
        "X-Title": "VOID AI",
      },
      body: JSON.stringify({
        model: model || "openai",
        stream: isStream || false,

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
      }),
    });

    console.log(messages)

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      console.log(upstreamResponse);
      return new Response("Upstream failed", { status: 502 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamResponse.body!.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value);
          controller.enqueue(encoder.encode(textChunk));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.log("API Error:", error);
    return Response.json(
      { error: "Ohh there's something wrong, try again!" },
      { status: 500 }
    );
  }
}
