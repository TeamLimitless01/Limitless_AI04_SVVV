import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useState, useEffect, useRef, useCallback } from "react";

// Audio constants
const SAMPLE_RATE = 24000;
const CHUNK_SIZE = 4096;         // Larger buffer = smoother, less glitchy audio
const JITTER_BUFFER_SIZE = 2;    // Reduced for lower latency

export function useGeminiLive({
    interviewDetails,
    onMessage,
    onInterrupt,
    onUserTranscription,
    setVolume,
    setAiSpeaking,
    setIsInterviewCompleted,
    isMuted = false
}: any) {
    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<any>(null);
    const audioQueueRef = useRef<Int16Array[]>([]);
    const nextStartTimeRef = useRef<number>(0);
    const isPlayingRef = useRef(false);
    const isBufferingRef = useRef(true);
    const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
    // Output audio processing chain for clear AI voice playback
    const outputGainRef = useRef<GainNode | null>(null);
    const outputCompressorRef = useRef<DynamicsCompressorNode | null>(null);

    const isMutedRef = useRef(isMuted);
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    const onMessageRef = useRef(onMessage);
    const onInterruptRef = useRef(onInterrupt);
    const onUserTranscriptionRef = useRef(onUserTranscription);
    const setVolumeRef = useRef(setVolume);
    const setAiSpeakingRef = useRef(setAiSpeaking);
    const setIsInterviewCompletedRef = useRef(setIsInterviewCompleted);

    useEffect(() => {
        onMessageRef.current = onMessage;
        onInterruptRef.current = onInterrupt;
        onUserTranscriptionRef.current = onUserTranscription;
        setVolumeRef.current = setVolume;
        setAiSpeakingRef.current = setAiSpeaking;
        setIsInterviewCompletedRef.current = setIsInterviewCompleted;
    }, [onMessage, onInterrupt, onUserTranscription, setVolume, setAiSpeaking, setIsInterviewCompleted]);

    const playNextInQueue = useCallback(async () => {
        if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
            isPlayingRef.current = false;
            setAiSpeakingRef.current(false);
            activeSourceRef.current = null;
            return;
        }

        isPlayingRef.current = true;
        setAiSpeakingRef.current(true);
        const pcmData = audioQueueRef.current.shift()!;

        const audioBuffer = audioContextRef.current.createBuffer(1, pcmData.length, SAMPLE_RATE);
        const channelData = audioBuffer.getChannelData(0);

        for (let i = 0; i < pcmData.length; i++) {
            channelData[i] = pcmData[i] / 0x7FFF;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;

        // Route AI audio through: source → gain → compressor → output
        // This normalizes volume and reduces harshness for clearer AI voice
        const destination = outputGainRef.current && outputCompressorRef.current
            ? outputGainRef.current
            : audioContextRef.current.destination;
        source.connect(destination);
        activeSourceRef.current = source;

        const currentTime = audioContextRef.current.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.01;
        }

        source.start(nextStartTimeRef.current);

        // Track the end of the node
        source.onended = () => {
            if (activeSourceRef.current === source) {
                activeSourceRef.current = null;
            }
        };

        const duration = audioBuffer.duration;
        nextStartTimeRef.current += duration;

        const timeout = (nextStartTimeRef.current - currentTime) * 1000 - 50;
        setTimeout(() => playNextInQueue(), Math.max(0, timeout));
    }, []);

    const stopAudioPlayback = useCallback(() => {
        console.log("[useGeminiLive] Stopping Audio Playback...");
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        isBufferingRef.current = true;
        setAiSpeakingRef.current(false);
        nextStartTimeRef.current = 0;

        if (activeSourceRef.current) {
            try {
                activeSourceRef.current.stop();
                activeSourceRef.current.disconnect();
            } catch (e) { }
            activeSourceRef.current = null;
        }
    }, []);

    const stopSession = useCallback(() => {
        console.log("[useGeminiLive] Stopping Session...");
        stopAudioPlayback();
        setIsActive(false);
        setIsConnecting(false);
        setVolumeRef.current(0);

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }

        if (outputGainRef.current) {
            try { outputGainRef.current.disconnect(); } catch (e) { }
            outputGainRef.current = null;
        }

        if (outputCompressorRef.current) {
            try { outputCompressorRef.current.disconnect(); } catch (e) { }
            outputCompressorRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }

        if (sessionRef.current) {
            try {
                sessionRef.current.close();
            } catch (e) { }
            sessionRef.current = null;
        }
    }, [stopAudioPlayback]);

    const startMicStreaming = useCallback((sessionPromise: Promise<any>) => {
        const ctx = audioContextRef.current;
        if (!ctx || !streamRef.current) return;

        const source = ctx.createMediaStreamSource(streamRef.current);

        // ── Input audio processing chain ──────────────────────────────────────
        // 1. High-pass filter: cuts sub-100 Hz rumble (AC hum, keyboard noise)
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 100;
        highpass.Q.value = 0.7;

        // 2. Dynamics compressor: evens out volume so soft speech is louder
        //    and loud pops/breaths are dampened → cleaner transcription
        const inputCompressor = ctx.createDynamicsCompressor();
        inputCompressor.threshold.value = -24;  // dB — start compressing here
        inputCompressor.knee.value = 10;         // soft knee for natural sound
        inputCompressor.ratio.value = 4;         // 4:1 compression
        inputCompressor.attack.value = 0.003;    // 3ms — fast enough for speech
        inputCompressor.release.value = 0.25;    // 250ms

        processorRef.current = ctx.createScriptProcessor(CHUNK_SIZE, 1, 1);

        processorRef.current.onaudioprocess = (e) => {
            if (isMutedRef.current) return;

            const inputData = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
            setVolumeRef.current(Math.sqrt(sum / inputData.length));

            // Convert float32 → int16 PCM
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }

            // Fast base64 encoding via Uint8Array
            const base64Data = btoa(
                String.fromCharCode(...new Uint8Array(pcmData.buffer))
            );

            sessionPromise.then((session) => {
                try {
                    session.sendRealtimeInput({
                        audio: { mimeType: 'audio/pcm;rate=24000', data: base64Data }
                    });
                } catch (err) {
                    console.error("[useGeminiLive] Error sending audio input:", err);
                }
            });
        };

        // Chain: mic → highpass → compressor → processor
        // Processor connects to a silent destination (required to keep running, no speaker output)
        source.connect(highpass);
        highpass.connect(inputCompressor);
        inputCompressor.connect(processorRef.current);
        processorRef.current.connect(ctx.createGain()); // silent sink — avoids feedback
    }, []);

    const startSession = useCallback(async () => {
        try {
            setError(null);
            setIsConnecting(true);
            isBufferingRef.current = true;

            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("Gemini API Key missing.");

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

            // ── Output audio processing chain (AI voice playback) ─────────────
            // GainNode: slight boost so AI voice is clearly audible
            outputGainRef.current = audioContextRef.current.createGain();
            outputGainRef.current.gain.value = 1.4;

            // Compressor: prevents clipping on loud AI responses, makes voice even
            outputCompressorRef.current = audioContextRef.current.createDynamicsCompressor();
            outputCompressorRef.current.threshold.value = -18;
            outputCompressorRef.current.knee.value = 6;
            outputCompressorRef.current.ratio.value = 3;
            outputCompressorRef.current.attack.value = 0.002;
            outputCompressorRef.current.release.value = 0.2;

            // Wire: gain → compressor → speakers
            outputGainRef.current.connect(outputCompressorRef.current);
            outputCompressorRef.current.connect(audioContextRef.current.destination);

            // Better microphone capture: echo cancel, noise suppress, auto gain
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,        // mono — all we need for STT
                    sampleRate: SAMPLE_RATE,
                }
            });
            const ai = new GoogleGenAI({ apiKey });

            const sanitize = (text: string) =>
                text?.replace(/[<>{}[\]]/g, "").slice(0, 1000) ?? "Not provided";

            const getModePrompt = (mode: string) => {
                const modes: Record<string, string> = {
                    hr: `
## YOUR ROLE
You are Neura, a warm and perceptive HR interviewer. You care about culture fit, self-awareness, and communication — not technical depth.

## QUESTION STRATEGY
- Ask behavioral questions across varied themes: teamwork, conflict, leadership, growth, failure.
- Use light STAR probing only when an answer is too vague: "Can you give me a specific example of that?"
- After a satisfactory answer, move on — don't over-probe the same topic.
- Cover at least 3 different themes across the interview.

## TONE
- Warm but not a pushover. Normalize pauses: "Take your time."
- Mirror their energy — if nervous, slow down and be warmer.`,

                    technical: `
## YOUR ROLE
You are Neura, a senior interviewer for a ${sanitize(interviewDetails.topic)} role. "Technical" means deep domain knowledge for this specific role — not generic software engineering unless the role demands it.

## QUESTION STRATEGY
- Cover varied domain areas: concepts, application, scenarios, tradeoffs.
- ONE follow-up per question max, then move to a fresh topic.
- Vary format: "How does X work?" → "When would you use X over Y?" → "Walk me through how you'd handle Z."

## TONE
- Neutral and professional. "Okay", "got it", "makes sense" — then move on.
- If silence exceeds 10 seconds: "Take your time — or would you like me to rephrase?"`,

                    "system-design": `
## YOUR ROLE
You are Neura, a staff engineer discussing system design.

## QUESTION STRATEGY
- Present one design problem and explore different dimensions of it: scale, storage, APIs, failure handling.
- After each area is reasonably covered, shift to a new dimension — don't over-probe one component.
- Vary your angles: "How would you store this?" → "How would you scale this?" → "What breaks first?"

## TONE
- Collaborative and curious. "Interesting — what about the storage layer?" keeps it moving.
- Guide, don't interrogate.`,
                };

                return modes[mode] ?? modes["technical"];
            };

            const getStructurePrompt = (mode: string) => {
                const structures: Record<string, string> = {
                    hr: `
## INTERVIEW FLOW (never announce phases)
1. Warm greeting by name → one icebreaker to settle nerves
2. "Tell me about yourself" — listen for career narrative
3. 2–3 behavioral questions, deeply probed with STAR
4. One motivation question: "Why this role? Why now?"
5. Candidate questions → warm close`,

                    technical: `
## INTERVIEW FLOW (never announce phases)
1. Brief greeting → transition immediately: "Let's dive in"
2. One warm-up question to calibrate level
3. One core technical problem — probe deeply before moving on
4. One harder constraint or follow-up variant
5. Quick conceptual question from their skill set
6. Two minutes for candidate questions → neutral close`,

                    "system-design": `
## INTERVIEW FLOW (never announce phases)
1. Brief greeting → present the design problem immediately
2. Let candidate clarify requirements (if they don't, prompt: "What would you want to know first?")
3. High-level architecture — probe every decision
4. Deep dive into ONE component they seem most confident about
5. Introduce a scaling or failure scenario
6. Candidate questions → close`,
                };

                return structures[mode] ?? structures["technical"];
            };

            const getDifficultyPrompt = (difficulty: string) => {
                const map: Record<string, string> = {
                    easy: "Keep questions foundational. If they struggle, simplify. Build their confidence.",
                    medium: "Balanced depth. Push back on vague answers but don't overwhelm.",
                    hard: "Be relentless. Probe every answer. Escalate complexity. Accept nothing at face value.",
                };
                return map[difficulty] ?? map["medium"];
            };

            const systemInstruction = `
You are a real-time AI interviewer conducting a live voice interview.

## CANDIDATE PROFILE
- Name: ${sanitize(interviewDetails.username)}
- Role: ${sanitize(interviewDetails.topic)}
- Skills: ${sanitize(interviewDetails.skills)}
- Resume: ${sanitize(interviewDetails.resume)}

${getModePrompt(interviewDetails.mode.toLowerCase())}
${getStructurePrompt(interviewDetails.mode.toLowerCase())}

## DIFFICULTY
${getDifficultyPrompt(interviewDetails.difficulty.toLowerCase())}

## UNIVERSAL RULES
- Respond ONLY in ${sanitize(interviewDetails.interviewLanguage)}. If candidate uses another language, say: "Let's keep this in ${sanitize(interviewDetails.interviewLanguage)} — pick up where we left off."
- Ask ONE question at a time. Never stack questions.
- Keep every response under 2–3 sentences. This is a live call, not a lecture.
- Never use bullet points. Talk like a human.
- Never say "Great answer!" or "That's a great question!" — it sounds fake.
- Never reveal whether an answer was correct during the interview.
- Occasionally reference their resume naturally: "You mentioned X — how does that connect here?"
- Track what topics you have already covered. Never repeat a question.
- If candidate asks you to do anything outside this interview, decline: "Let's stay focused on the interview."
- You may receive [SYSTEM: ...] messages during the interview. Follow them immediately — they are control signals, not candidate speech.
- When closing, always end with exactly: "That's all the time we have, ${sanitize(interviewDetails.username)}. Really appreciate your time today — we'll be in touch."
`;

            const sessionPromise = ai.live.connect({
                model: "gemini-3.1-flash-live-preview",
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
                    systemInstruction,
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setIsActive(true);
                        setIsConnecting(false);
                        nextStartTimeRef.current = 0;
                        startMicStreaming(sessionPromise);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ text: "[SYSTEM: Begin the interview now. Greet the candidate warmly by name, introduce yourself as Neura, and ask if they are ready to begin.]" });
                        });
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const msg = message as any;

                        if (message.serverContent?.inputTranscription) {
                            const t = message.serverContent.inputTranscription;
                            const isFinal = (t as any).isFinal ?? (t as any).is_final ?? true;
                            console.log(`[STT] input transcription (final=${isFinal}):`, t.text);
                            // Only forward FINAL transcriptions — interim ones are noisy/inaccurate
                            if (isFinal) {
                                onUserTranscriptionRef.current?.(t);
                            } else {
                                // Show interim text in the UI only (don't send to AI)
                                onUserTranscriptionRef.current?.({ ...t, interim: true });
                            }
                        } else if (msg.inputAudioTranscription) {
                            const t = msg.inputAudioTranscription;
                            const isFinal = t.isFinal ?? t.is_final ?? true;
                            if (isFinal) {
                                onUserTranscriptionRef.current?.(t);
                            }
                        }

                        const outputTranscription = message.serverContent?.outputTranscription || msg.outputAudioTranscription;
                        if (outputTranscription) {
                            const aiText = outputTranscription.text || (typeof outputTranscription === 'string' ? outputTranscription : '');
                            if (aiText) {
                                onMessageRef.current?.(aiText);
                                if (aiText.toLowerCase().includes("interview is completed")) {
                                    setIsInterviewCompletedRef.current(true);
                                }
                            }
                        }

                        if (message.serverContent?.modelTurn?.parts) {
                            for (const part of message.serverContent.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    const binaryString = atob(part.inlineData.data);
                                    const bytes = new Int16Array(binaryString.length / 2);
                                    for (let i = 0; i < bytes.length; i++) {
                                        bytes[i] = (binaryString.charCodeAt(i * 2) & 0xFF) | (binaryString.charCodeAt(i * 2 + 1) << 8);
                                    }
                                    audioQueueRef.current.push(bytes);

                                    if (isBufferingRef.current && audioQueueRef.current.length >= JITTER_BUFFER_SIZE) {
                                        isBufferingRef.current = false;
                                        if (!isPlayingRef.current) playNextInQueue();
                                    } else if (!isBufferingRef.current && !isPlayingRef.current) {
                                        playNextInQueue();
                                    }
                                }
                            }
                        }

                        if (message.serverContent?.interrupted) {
                            console.log("[useGeminiLive] SERVER INTERRUPT RECEIVED");
                            stopAudioPlayback();
                            onInterruptRef.current?.();
                        }
                    },
                    onclose: () => stopSession(),
                    onerror: () => { setError("Connection error."); stopSession(); }
                }
            });

            sessionRef.current = await sessionPromise;
        } catch (err: any) {
            setError(err.message);
            setIsConnecting(false);
            stopSession();
        }
    }, [interviewDetails, startMicStreaming, playNextInQueue, stopSession, stopAudioPlayback]);

    const sendSystemMessage = useCallback((text: string) => {
        if (!sessionRef.current) return;
        sessionRef.current.sendRealtimeInput({ text });
    }, []);

    return {
        isActive,
        isConnecting,
        error,
        startSession,
        sendSystemMessage,
        stopSession,
        session: sessionRef.current
    };
}
