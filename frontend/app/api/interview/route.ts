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
      currentQuestionIndex = 1,
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
Follow instructions exactly. Do not improvise or ask extra questions.

INTERVIEW CONFIG:
- Candidate: ${username}
- Target Role: ${jobRole}
- Skills: ${skills}
- Difficulty: ${difficulty}
- Total Questions: ${numOfQuestions}
- Current Question: ${currentQuestionIndex}
- Interview Language(Strickly use): ${interviewLanguage}
- Interview Mode: ${interviewMode} (HR or Technical)

PHASE INSTRUCTIONS:
${getPhaseInstructions(currentQuestionIndex, numOfQuestions)}

SAFETY RULES:
- Max 4 sentences per response
- No jargon or robotic phrases
- Stay in ${interviewLanguage} only
- NEVER ask more questions than specified
- When instructed to end, use EXACT words: "The interview is completed, please generate report. Thanks for using Neuraview."
- If instructions are unclear, say: "I need to follow the interview script. Please continue."

INTERVIEW SCRIPT:
- Ask only the question specified
- Wait for candidate response
- Do not add extra commentary
- Follow the phase exactly as written
`;

    function getPhaseInstructions(currentQuestionIndex: any, numOfQuestions: any) {
      if (currentQuestionIndex > numOfQuestions) {
        return `WRAP-UP PHASE:
STOP asking questions.
SAY ONLY: "The interview is completed, please generate report. Thanks for using Neuraview."
TERMINATE IMMEDIATELY.`;
      }

      if (currentQuestionIndex === numOfQuestions && numOfQuestions > 1) {
        return `${getModeSpecificFinalPrompt()}`;
      }

      if (currentQuestionIndex === 1) {
        return getModeSpecificIntroduction();
      }

      return getModeSpecificCoreAssessment();
    }

    function getModeSpecificFinalPrompt() {
      if (interviewMode === 'HR') {
        return `FINAL HR PHASE:
Acknowledge this is the last question.
Ask about their overall fit and growth potential.
EXAMPLE: "This is our final question. Based on our conversation, how do you see yourself contributing to our team culture and what are your career goals here?"`;
      } else {
        return `FINAL TECHNICAL PHASE:
Acknowledge this is the last question.
Ask ONE comprehensive technical problem.
EXAMPLE: "This is our final technical challenge. Here's the complete problem: [insert complex technical scenario]. Walk me through your solution step by step."`;
      }
    }

    function getModeSpecificIntroduction() {
      if (interviewMode === 'HR') {
        return `INTRODUCTION PHASE (HR):
GREET: "Hello ${username}, nice to meet you."
BUILD RAPPORT: "I'm excited to discuss the ${jobRole} role. Your experience in ${skills} caught my attention."
ASK: "To start, could you share your journey and what motivates you professionally?"`;
      } else {
        return `INTRODUCTION PHASE (Technical):
GREET: "Hello ${username}, nice to meet you."
SET CONTEXT: "We'll be discussing technical aspects of the ${jobRole} role, focusing on ${skills}."
ASK: "Let's start with your background. Can you walk me through your experience with ${skills}?"`;
      }
    }

    function getModeSpecificCoreAssessment() {
      if (interviewMode === 'HR') {
        return `CORE ASSESSMENT PHASE (HR):
ACKNOWLEDGE: "That's insightful." or "I understand your perspective."
TRANSITION: "That's helpful context."
ASK: ONE behavioral question about ${skills}.
FOCUS: Past experiences and soft skills.
EXAMPLE: "Tell me about a time you had to [situation] involving ${skills}. What was the outcome?"`;
      } else {
        return `CORE ASSESSMENT PHASE (Technical):
ACKNOWLEDGE: Briefly validate their technical understanding.
TRANSITION: "Let's dive deeper into..."
ASK: ONE specific technical question about ${skills}.
FOCUS: Practical application and problem-solving.
EXAMPLE: "How would you implement [technical concept] using ${skills}? What challenges might you face?"`;
      }
    }

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
