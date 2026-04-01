# 🚀 AI Interview Core Feature Optimization Guide

This document outlines strategies to optimize the **AI Interviewer** (the heart of NeuraView) across latency, AI reasoning, and real-time performance.

---

## 1. ⚡ Latency & Response Speed
The #1 factor for a "natural" interview is low latency.

### 💨 AI Conversation (LLM)
*   **Streaming Responses**: Transition from full JSON extraction to **Server-Sent Events (SSE)**.
    *   *Implementation*: Use `ai` SDK's `StreamingTextResponse`. This allows the AI to start speaking as soon as the first token is generated.
*   **Edge Functions**: Deploy the `/api/chat` route to **Vercel Edge Runtime**.
    *   *Why*: Reduces Time to First Byte (TTFB) by running code physically closer to the user.
*   **Prompt Caching**: Use models like **Mistral Large** or **Gemini 1.5 Pro** with context caching if supported by the provider (e.g., Google AI Studio).

### 🎙️ Text-to-Speech (TTS)
*   **Pre-fetching**: Use a "Buffer & Play" strategy.
    *   *Tip*: While the AI is still generating text, slice the sentences and send them in parallel to the TTS engine (OpenAI TTS or ElevenLabs).
*   **Low-Latency Models**: Switch to `tts-1` (instead of `tts-1-hd`) for 50% faster audio generation with negligible quality loss in noisy environments.

---

## 2. 🤖 AI Interviewer "Persona" & Logic
Optimization isn't just speed; it's the quality of the interaction.

### 🧠 Context Management
*   **Resume-Aware Branching**: We currently extract `aiSummary` from resumes.
    *   *Optimization*: Use this summary in the **System Prompt** to create "Recursive Questions." 
    *   *Example*: "Since you mentioned in your resume that you handled 1m+ QPS at [Company], how did you manage the database locks specifically?"
*   **Adaptive Difficulty**: 
    *   If the candidate answers a "Medium" question expertly, use a hidden score within the chat metadata to bump the next question to "Hard."

### 🛡️ Guardrails
*   **Interrupt Handling**: Optimize the `MediaRecorder` loop to detect when the user starts speaking while the AI is talking.
    *   The app currently uses a `stop()` function; ensure it clears the audio buffer immediately to avoid overlapping voices.

---

## 3. 👁️ Real-time Analytics (Face Mesh)
The computer vision loop can be the heaviest part of the UI.

### 📉 Browser Performance
*   **Worker-Based Detection**: Move the `FaceMesh` (Mediapipe) processing into a **Web Worker**.
    *   *Benefit*: Keeps the UI thread (60FPS) separate from the 10-15FPS required for emotion detection.
*   **Sampling Rate**: You don't need to analyze 60 frames per second.
    *   *Tip*: Reduce detection to **5-8 samples per second**. This is more than enough for emotional trend-lining and saves 80% CPU usage on low-end laptops.

---

## 4. 📊 Reporting Workflow
Report generation can feel slow if it blocks the user.

### 🏗️ Background Processing
*   **Webhook-First Reports**: 
    *   When an interview ends, return the user to the dashboard immediately.
    *   Trigger the report generation in a **Background Job** (e.g., Upstash Workflow or Inngest).
*   **JSON-Schema Strictness**: Use **Zod** on the frontend to parse the AI report output.
    *   We currently use a regex-based JSON cleaner in `/api/interview/report`. Replacing this with a more robust parser prevents "Invalid JSON" errors from ruining a report.

---

## 5. 🛠️ Development & Observability
*   **Sentry/LogRocket**: Track where interviews "hang."
*   **Token Usage**: Monitor the `api/chat` tokens. Long interviews (30m+) can hit context limits.
    *   *Optimization*: Only keep the last 10 messages in the context window for the LLM, but keep a summarized "Global Context" of the progress.

---

**Next Immediate Goal**: Implement **Vercel Edge Runtime** for the `/api/chat` route to cut response time in half.
