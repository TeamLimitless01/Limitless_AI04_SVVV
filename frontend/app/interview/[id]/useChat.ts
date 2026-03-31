import { useCallback, useState, useRef } from "react";
import toast from "react-hot-toast";

export function useChat({
  messages = [],
  setMessages = () => { },
  setAiSpeaking = () => { },
  setIsInterviewCompleted = () => { },
  generateSpeech = () => { }, // TTS function
  queueText = (text: string) => { },
  flush = () => { },
  stop = () => { }, // 🔹 Added stop function
  speechEnabled = true,
}: any) {
  const [isLoading, setIsLoading] = useState(false);


  const lastUpdateTimeRef = useRef<number>(0);
  const aiContentRef = useRef<string>("");

  const sendMessage = useCallback(
    async ({ content, interviewDetails }: any): Promise<void> => {
      if (!content) return;
      stop();

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: Array.isArray(content) ? [...content] : content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev: any) => [...prev, userMessage]);
      setIsLoading(true);
      setAiSpeaking(true);

      const assistantMessagesCount = messages.filter((m: any) => m.role === "assistant").length;
      const currentQuestionIndex = assistantMessagesCount + 1;

      console.log(`[useChat] sendMessage - Total Messages: ${messages.length}, Assistant Messages: ${assistantMessagesCount}, Computed Index: ${currentQuestionIndex}`);

      const abortController = new AbortController();

      try {
        const response = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            messages: [
              ...messages.map(({ role, content }: any) => ({ role, content })),
              { role: userMessage.role, content: userMessage.content }
            ],
            stream: true,
            interviewDetails: {
              ...interviewDetails,
              currentQuestionIndex
            },
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Upstream error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        aiContentRef.current = "";
        let sentenceBuffer = "";

        const aiMessage: any = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setMessages((prev: any) => [...prev, aiMessage]);

        let buffer = "";
        lastUpdateTimeRef.current = Date.now();

        const updateMessageState = (force = false) => {
          const now = Date.now();
          if (force || now - lastUpdateTimeRef.current > 100) {
            setMessages((prev: any) => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              const lastIndex = updated.findLastIndex((m: any) => m.role === "assistant" && m.id === aiMessage.id);
              if (lastIndex !== -1 && updated[lastIndex].content !== aiContentRef.current) {
                updated[lastIndex] = { ...updated[lastIndex], content: aiContentRef.current };
                return updated;
              }
              return prev;
            });
            lastUpdateTimeRef.current = now;
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            if (sentenceBuffer.trim() && speechEnabled) {
              queueText(sentenceBuffer.trim());
              flush();
            }
            updateMessageState(true);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          let lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace("data:", "").trim();
            if (jsonStr === "[DONE]") {
              buffer = "";
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const contentPiece = parsed.choices?.[0]?.delta?.content;

              if (contentPiece) {
                aiContentRef.current += contentPiece;
                sentenceBuffer += contentPiece;

                // Robust Completion Check
                const lowerContent = aiContentRef.current.toLowerCase();
                if (
                  (lowerContent.includes("interview is completed") && lowerContent.includes("report")) ||
                  lowerContent.includes("इंटरव्यू पूरा हो गया") ||
                  (lowerContent.includes("गया है") && lowerContent.includes("रिपोर्ट"))
                ) {
                  setIsInterviewCompleted(true);
                }

                if (speechEnabled) {
                  // const splitRegex = /(?<=[.!?,\n])/;
                  const splitRegex = /(?<=[.?\n])/;
                  if (splitRegex.test(contentPiece) || sentenceBuffer.length > 70) {
                    const fragments = sentenceBuffer.split(splitRegex);
                    if (fragments.length > 1) {
                      const toQueue = fragments.slice(0, -1).join("").trim();
                      if (toQueue.length > 1) {
                        queueText(toQueue);
                        updateMessageState(true);
                      }
                      sentenceBuffer = fragments[fragments.length - 1];
                    }
                  }
                }
                updateMessageState();
              }
            } catch (err) {
              // Ignore partial JSON chunks during stream
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error("Chat error:", error);
        toast.error("Network communication interrupted. Please check your connection.");
      } finally {
        setIsLoading(false);
        setAiSpeaking(false);
      }
    },
    [queueText, flush, stop, speechEnabled, setMessages, setAiSpeaking, setIsInterviewCompleted, messages]
  );

  return {
    messages,
    isLoading,
    sendMessage,
  };
}

