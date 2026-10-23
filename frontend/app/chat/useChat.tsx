"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const STORAGE_KEY = "neuraview-chat-history-v2";
const LEGACY_STORAGE_KEY = "ai-chat-history";
const MAX_SESSIONS = 30;
const MAX_MESSAGES_PER_SESSION = 60;

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string | ChatContentPart[];
  timestamp: Date;
};

export type ChatSession = {
  id: string;
  title: string;
  updatedAt: Date;
  messages: ChatMessage[];
};

function messageText(content: ChatMessage["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((part): part is Extract<ChatContentPart, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
}

function normalizeSessions(value: unknown): ChatSession[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (session): session is ChatSession =>
        Boolean(
          session &&
          typeof session.id === "string" &&
          typeof session.title === "string" &&
          Array.isArray(session.messages),
        ),
    )
    .map((session) => ({
      ...session,
      updatedAt: Number.isNaN(new Date(session.updatedAt).getTime()) ? new Date() : new Date(session.updatedAt),
      messages: session.messages
        .filter(
          (message: ChatMessage) =>
            message &&
            typeof message.id === "string" &&
            (message.role === "user" || message.role === "assistant") &&
            (typeof message.content === "string" || Array.isArray(message.content)),
        )
        .map((message: ChatMessage) => ({
          ...message,
          timestamp: Number.isNaN(new Date(message.timestamp).getTime())
            ? new Date()
            : new Date(message.timestamp),
        }))
        .slice(-MAX_MESSAGES_PER_SESSION),
    }))
    .filter((session) => session.messages.length > 0)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, MAX_SESSIONS);
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loadedSessions = normalizeSessions(JSON.parse(stored));
        setSessions(loadedSessions);
        setActiveSessionId(loadedSessions[0]?.id ?? null);
      } else {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          const oldMessages = JSON.parse(legacy) as ChatMessage[];
          if (Array.isArray(oldMessages) && oldMessages.length > 0) {
            const migrated = normalizeSessions([{
              id: createId(),
              title: "Previous conversation",
              updatedAt: new Date(),
              messages: oldMessages,
            }]);
            setSessions(migrated);
            setActiveSessionId(migrated[0]?.id ?? null);
          }
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to load saved chats:", error);
      toast.error("Saved chat history could not be loaded.");
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const timeoutId = window.setTimeout(() => {
      try {
        if (sessions.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to save chat history:", error);
        toast.error("Chat history could not be saved. Try removing older conversations.");
      }
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [isReady, sessions]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );
  const messages = activeSession?.messages ?? [];

  const createNewChat = useCallback(() => {
    if (isLoading) return;
    setActiveSessionId(null);
  }, [isLoading]);

  const selectSession = useCallback((id: string) => {
    if (isLoading) return;
    setActiveSessionId(id);
  }, [isLoading]);

  const deleteSession = useCallback((id: string) => {
    const remaining = sessions.filter((session) => session.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) setActiveSessionId(remaining[0]?.id ?? null);
  }, [activeSessionId, sessions]);

  const sendMessage = useCallback(async (content: string | ChatContentPart[]): Promise<void> => {
    if (isLoading) return;
    const text = messageText(content);
    if (text.length > 12_000) {
      toast.error("Keep your message under 12,000 characters.");
      return;
    }
    if (typeof content === "string" && !content.trim()) return;
    if (Array.isArray(content) && !text && !content.some((part) => part.type === "image_url")) return;

    const sessionId = activeSessionId ?? createId();
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    const conversationHistory = activeSession?.messages ?? [];
    const recentHistory = [...conversationHistory, userMessage].slice(-20);
    const imageSize = (message: ChatMessage) =>
      Array.isArray(message.content)
        ? message.content.reduce(
            (total, part) => total + (part.type === "image_url" ? part.image_url.url.length : 0),
            0,
          )
        : 0;
    while (recentHistory.length > 1 && recentHistory.reduce((total, message) => total + imageSize(message), 0) > 2_300_000) {
      recentHistory.shift();
    }
    const apiMessages = recentHistory.map(({ role, content: messageContent }) => ({
      role,
      content: messageContent,
    }));

    setActiveSessionId(sessionId);
    setSessions((previous) => {
      const existing = previous.find((session) => session.id === sessionId);
      const nextMessages = [...(existing?.messages ?? []), userMessage].slice(-MAX_MESSAGES_PER_SESSION);
      const title = existing?.title || text.slice(0, 52) || "Image question";
      const nextSession: ChatSession = {
        id: sessionId,
        title,
        updatedAt: new Date(),
        messages: nextMessages,
      };
      return [nextSession, ...previous.filter((session) => session.id !== sessionId)].slice(0, MAX_SESSIONS);
    });
    setIsLoading(true);

    let assistantMessageId: string | null = null;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          model: localStorage.getItem("model") || "",
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Neura could not respond. Please try again.");
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      assistantMessageId = assistantMessage.id;
      setSessions((previous) => previous.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              updatedAt: new Date(),
              messages: [...session.messages, assistantMessage].slice(-MAX_MESSAGES_PER_SESSION),
            }
          : session,
      ));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      const updateAssistant = (piece: string) => {
        assistantContent += piece;
        setSessions((previous) => previous.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                updatedAt: new Date(),
                messages: session.messages.map((message) =>
                  assistantMessageId && message.id === assistantMessageId
                    ? { ...message, content: assistantContent }
                    : message,
                ),
              }
            : session,
        ));
      };

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        if (done && buffer) {
          lines.push(buffer);
          buffer = "";
        }

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const json = trimmed.slice(5).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const piece = parsed.choices?.[0]?.delta?.content;
            if (typeof piece === "string") updateAssistant(piece);
          } catch (error) {
            console.error("Could not parse a streamed chat response chunk:", error);
          }
        }
        if (done) break;
      }
    } catch (error) {
      console.error("Chat request failed:", error);
      if (assistantMessageId) {
        setSessions((previous) => previous.map((session) =>
          session.id === sessionId
            ? { ...session, messages: session.messages.filter((message) => message.id !== assistantMessageId) }
            : session,
        ));
      }
      toast.error(error instanceof Error ? error.message : "Unable to send your message.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, activeSessionId, isLoading]);

  const clearMessages = useCallback(() => {
    if (!activeSessionId) return;
    setSessions((previous) => previous.filter((session) => session.id !== activeSessionId));
    setActiveSessionId(null);
    toast.success("Conversation removed from chat history.");
  }, [activeSessionId]);

  const exportHistory = useCallback(() => {
    try {
      const historyText = messages
        .map((message) => {
          const timestamp = message.timestamp.toLocaleString();
          const role = message.role === "user" ? "You" : "Neura";
          const text = messageText(message.content);
          const imageNote = Array.isArray(message.content) && message.content.some((part) => part.type === "image_url")
            ? "\n[Image attached]"
            : "";
          return `[${timestamp}] ${role}: ${text}${imageNote}`;
        })
        .join("\n\n");
      const blob = new Blob([historyText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `neuraview-chat-${new Date().toISOString().slice(0, 10)}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Conversation downloaded.");
    } catch (error) {
      console.error("Failed to export chat history:", error);
      toast.error("Unable to export this conversation.");
    }
  }, [messages]);

  return {
    messages,
    sessions,
    activeSessionId,
    isLoading,
    isReady,
    sendMessage,
    createNewChat,
    selectSession,
    deleteSession,
    clearMessages,
    exportHistory,
  };
}
