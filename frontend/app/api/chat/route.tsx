import { systemtPrompt } from "./systemPrompt";
import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(12_000),
});
const imagePartSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z
      .string()
      .max(1_400_000)
      .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/),
  }),
});
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string().trim().min(1).max(12_000),
    z
      .array(z.union([textPartSchema, imagePartSchema]))
      .min(1)
      .max(2),
  ]),
});
const requestSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(20),
    model: z.string().max(120).optional(),
    stream: z.boolean().optional(),
    personality: z.string().max(100).optional(),
    provider: z.string().max(100).optional(),
  })
  .superRefine((request, context) => {
    const imageBytes = request.messages.reduce((total, message) => {
      if (typeof message.content === "string") return total;
      return (
        total +
        message.content.reduce(
          (size, part) =>
            size + (part.type === "image_url" ? part.image_url.url.length : 0),
          0,
        )
      );
    }, 0);

    if (imageBytes > 2_400_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Attached images exceed the conversation upload limit.",
      });
    }
  });

export async function POST(req: Request) {
  try {
    const requestBody: unknown = await req.json();
    const parsedRequest = requestSchema.safeParse(requestBody);
    if (!parsedRequest.success) {
      return Response.json(
        {
          error:
            "Invalid chat request. Check your message length and image attachments.",
        },
        { status: 400 },
      );
    }

    const {
      messages,
      model,
      stream: isStream,
      personality,
      provider,
    } = parsedRequest.data;
    // const lastMessage = messages[messages.length - 1]?.content || "";

    console.log("Received messages:", personality, model, provider);

    // const imageKeywords = [
    //   "generate image",
    //   "create image",
    //   "make image",
    //   "draw",
    //   "picture of",
    //   "image of",
    //   "show me",
    //   "visualize",
    //   "illustration",
    //   "artwork",
    //   "photo of",
    // ];

    // const isImageRequest = imageKeywords.some((keyword) =>
    //   lastMessage.toLowerCase().includes(keyword)
    // );

    // if (isImageRequest) {
    //   let imagePrompt = lastMessage
    //     .replace(
    //       /generate image of|create image of|make image of|draw|picture of|image of|show me|visualize|illustration of|artwork of|photo of/gi,
    //       ""
    //     )
    //     .trim();

    //   if (!imagePrompt) {
    //     imagePrompt = lastMessage;
    //   }

    //   console.log("Image request detected:", imagePrompt);

    //   const encodedPrompt = encodeURIComponent(imagePrompt);
    //   const randomSeed = Math.floor(Math.random() * 100);
    //   const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?enhance=true&nologo=true&model=kontext&seed=${randomSeed}&token=${process.env.AI_API_TOKEN}&referer=${process.env.SITE_BASE_URL}`;

    //   return Response.json({
    //     message: `🎨 **Image Generated Successfully!**\n\n![Generated Image](${imageUrl})\n\n**Prompt:** ${imagePrompt}\n\n*AI has visualized your request! ✨*`,
    //     isImage: true,
    //     imageUrl: imageUrl,
    //     imagePrompt: imagePrompt,
    //   });
    // }

    // Prepare streaming request to pollinations.ai
    // https://text.pollinations.ai/openai

    const API_URI = "https://gen.pollinations.ai/v1/chat/completions";

    // console.log(typeof API_URI)

    const upstreamResponse = await fetch(API_URI, {
      method: "POST",
      headers: {
        Authorization: `Bearer sk_EAH7ZUybK4BpBtT4q2KEltJks5uxzZZX`,
        "Content-Type": "application/json",
        "HTTP-Referer": `${process.env.SITE_BASE_URL}`,
        "X-Title": "Neuraview - AI-Powered Mock Interviews",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-luna",
        stream: isStream || false,
        messages: [systemtPrompt, ...messages],
      }),
    });

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
    console.error("API Error:", error);
    return Response.json(
      { error: "Ohh there's something wrong, try again!" },
      { status: 500 },
    );
  }
}
