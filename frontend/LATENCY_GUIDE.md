# ⚡ Real-Time Latency Optimization Guide (Sarvam AI Edition)

For an AI interviewer to feel truly "physical" and human-like, the response time (Latency) must be below **1.5 seconds**. This guide outlines the specific technical strategies for the **Sarvam AI Workflow** to achieve near-instantaneous audio-to-audio conversation.

---

## 🛠️ 1. The "Pause-as-Trigger" Sequential Pipeline
*Organizing a chain reaction triggered by human silence.*

To maintain a natural flow, the system must treat a **Natural Pause** as the command to execute the next steps. This eliminates the need for "Push-to-Talk" and minimizes perceived lag.

### 🔄 The Sequential Chain Reaction:
1.  **Continuous STT Buffering**: Sarvam STT listens in real-time. Transcription results are "interim" while the user is still speaking.
2.  **The Pause Trigger**: 
    - The client-side or Sarvam-side **VAD (Voice Activity Detection)** detects a 400ms-600ms silence.
    - **Action**: Immediately send the `flush_signal: true` to Sarvam STT.
3.  **STT Finalization**: Sarvam returns `is_final: true` with the complete, punctuated transcript.
4.  **LLM Execution**: The moment `is_final` hits the client, the transcript is sent to the LLM. 
5.  **TTS Pipelining**: As the LLM streams tokens, they are fed sequentially to the Sarvam TTS WebSocket.

---

## 🎙️ 2. Organizing the "Silence Trigger"
- **Quiet Window Optimization**: Set your pause detection to roughly 500ms. 
  - *Too short (<300ms)*: Interrupts the user during natural thinking pauses.
  - *Too long (>800ms)*: Makes the AI feel "slow" or "sluggish".
- **Visual Feedback Transition**:
  - **Speaking State**: `Orb.tsx` pulses to user volume.
  - **Pause Triggered**: `Orb.tsx` immediately changes color/glow (e.g., to cyan) to signal "I'm thinking" before the first word is even spoken.
- **Sequential Handshake**:
  ```javascript
  // On Silence Detected (Pause Trigger)
  stt_ws.send(JSON.stringify({ type: "flush" })); 
  
  // When Transcription Finalized
  stt_ws.onmessage = (msg) => {
    if (msg.is_final) {
      startLLMChain(msg.transcript); // The Domino Effect starts here
    }
  };
  ```

---

## 🔊 3. Sarvam-Specific TTS Optimization
- **Streaming Chunks**: Feed the LLM stream directly into the TTS WebSocket. 
  - *Recommendation*: Wait for the first ~50 characters before sending the first `text` message to Sarvam to ensure natural prosody, then stream the rest.
- **Codec Selection**: Use `opus` or `aac` for compressed streaming over the network, or `pcm` if you want zero-decode latency on the frontend.
- **Keep-Alive**: Send a `{"type": "ping"}` every 30-45 seconds to keep the TTS connection warm during long user responses.

---

## 🧠 4. Frontend "Latency Masking"
- **The "Mirror" Effect**: While STT is processing, show a "Thinking..." animation or a glowing orb (like `Orb.tsx`) immediately.
- **Pre-emptive Buffering**: Start downloading the first audio chunk from Sarvam TTS while the second chunk is still being converted.
- **Filler Phrases**: Have a local array of short audio clips ("Hmm...", "I see...", "Interesting...") that play randomly if the LLM-to-TTS pipe takes >1.5s.

---

## 🛠️ 5. Technical Checklist for Sarvam Workflow
| Stage | Tech | Goal |
| :--- | :--- | :--- |
| **Input** | Sarvam STT WebSocket | `< 300ms` transcription |
| **Logic** | LLM SSE / Streaming | First token in `< 400ms` |
| **Output** | Sarvam TTS WebSocket | First audio chunk in `< 300ms` |
| **Total** | End-to-End | **Target: < 1.0s - 1.2s** |

---

> [!TIP]
> **Pro Implementation**: Use a **Web Worker** on the frontend to handle the binary audio calculations for the `mic-visualizer.tsx` and the WebSocket buffers. This keeps the main thread (UI) buttery smooth at 60fps while the "heavy" audio lifting happens in the background.
