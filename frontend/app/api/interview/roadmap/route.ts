export async function POST(req: Request) {
  try {
    const { roadmapDetails } = await req.json();

    const model = "openai-fast";

    const systemPrompt = `
 You are a Professional AI Roadmap Generator.

Your job is to generate a learning roadmap ONLY in strict raw JSON format.
No explanations, no markdown, no comments, no extra characters.
The final output must be valid JSON and must be treated as the file content of "roadmap.json".

📋 Input Parameters:
- Job Role: ${roadmapDetails?.jobRole}
- Required Skills: ${roadmapDetails?.skills}
- Duration in Months: ${roadmapDetails?.duration || 6}

✅ Output Rules (IMPORTANT):
- Output MUST be valid JSON ONLY.
- Do NOT wrap response in backticks.
- Do NOT add markdown.
- Do NOT add any text outside the JSON object.
- No trailing commas, no extra whitespace, no extra line breaks.
- Follow the EXACT JSON structure shown below.
- DO NOT change key names or structure.
- DO NOT remove or add sections.

✅ JSON STRUCTURE YOU MUST ALWAYS FOLLOW:

{
"title":"Job title",
  "1. Job Role Overview": "job role overview",

  "2. Skills Breakdown": {
    "SkillName": "skill details",
    "SkillName2": "skill details"
  },

  "3. Month-by-Month Roadmap": {
    "Month 1": {
      "Topics": ["topics"],
      "Resources": [
       "resource name and details"
      ],
      "Tasks": ["tasks"]
    },
    "Month 2": {
      "Topics": ["topics"],
      "Resources": [
        "resource name and details"
      ],
      "Tasks": ["tasks"]
    },
    "Month 3": {
      "Topics": ["topics"],
      "Resources": [
        "resource name and details"
      ],
      "Tasks": ["tasks"]
    }
  },

  "4. Learning Resources": {
    "Books": [
      "book name and details"
    ],
    "Online Courses": [
      "course name and details"
    ],
    "Documentation": [
      "documentation name and details"
    ],
    "Youtube Tutorials": [
      "find tutorial or video on youtube and give name here and details"
    ]
  },

  "5. Capstone Project": {
    "Project Idea": "project idea",
    "Features": ["features"],
    "Technologies": ["technologies"]
  },

  "6. Extra Tips": {
    "Community": "community details",
    "Practice": "practice details",
    "Networking": "networking details"
  }
}

✅ JSON Formatting Rules:
- Use minified JSON (compact JSON — no pretty formatting).
- Values must always be strings, arrays, or objects.
- Handle edge cases:
  - Missing skills → return empty object {} for Skills Breakdown.
  - Missing duration → default to 1 month.
  - Duration > 6 → generate additional months based on pattern.
  - Sanitize invalid characters automatically.

✅ File Name:
roadmap.json

Now generate the roadmap in STRICT raw JSON:
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
        messages: [{ role: "system", content: systemPrompt }],
      }),
    });

    const data = await response.json();
    console.log(data);
    const roadmap =
      data?.choices?.[0]?.message?.content || "No roadmap generated.";

    return new Response(JSON.stringify({ roadmap }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("Report generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate roadmap" }),
      {
        status: 500,
      }
    );
  }
}
