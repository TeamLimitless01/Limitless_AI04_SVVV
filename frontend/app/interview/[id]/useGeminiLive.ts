import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useState, useEffect, useRef, useCallback } from "react";

// Gemini Live Audio constants
const INPUT_SAMPLE_RATE = 16000;   // Gemini Live STT expects 16kHz mono PCM
const OUTPUT_SAMPLE_RATE = 24000;  // Gemini Live TTS generates 24kHz audio
const CHUNK_SIZE = 4096;
const JITTER_BUFFER_SIZE = 2;

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

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionRef = useRef<any>(null);

    const audioQueueRef = useRef<Int16Array[]>([]);
    const nextStartTimeRef = useRef<number>(0);
    const isPlayingRef = useRef(false);
    const isBufferingRef = useRef(true);
    const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const accumulatedAiTextRef = useRef<string>("");

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

    const stopAudioPlayback = useCallback(() => {
        console.log("[useGeminiLive] Stopping Audio Playback...");
        if (playbackTimeoutRef.current) {
            clearTimeout(playbackTimeoutRef.current);
            playbackTimeoutRef.current = null;
        }

        // Stop all currently scheduled/playing audio buffer sources immediately
        scheduledSourcesRef.current.forEach((source) => {
            try {
                source.stop();
                source.disconnect();
            } catch (e) { }
        });
        scheduledSourcesRef.current.clear();

        audioQueueRef.current = [];
        isPlayingRef.current = false;
        isBufferingRef.current = true;
        setAiSpeakingRef.current(false);
        nextStartTimeRef.current = 0;
    }, []);

    const playNextInQueue = useCallback(() => {
        const ctx = outputAudioContextRef.current;
        if (!ctx || audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            // Delay disabling speech indicator until currently scheduled audio finishes
            const remaining = Math.max(0, (nextStartTimeRef.current - (ctx?.currentTime ?? 0)) * 1000);
            setTimeout(() => {
                if (audioQueueRef.current.length === 0 && scheduledSourcesRef.current.size === 0) {
                    setAiSpeakingRef.current(false);
                }
            }, remaining);
            return;
        }

        isPlayingRef.current = true;
        setAiSpeakingRef.current(true);
        const pcmData = audioQueueRef.current.shift()!;

        const audioBuffer = ctx.createBuffer(1, pcmData.length, OUTPUT_SAMPLE_RATE);
        const channelData = audioBuffer.getChannelData(0);

        for (let i = 0; i < pcmData.length; i++) {
            channelData[i] = pcmData[i] / 0x7FFF;
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const destination = outputGainRef.current ?? ctx.destination;
        source.connect(destination);

        scheduledSourcesRef.current.add(source);
        source.onended = () => {
            scheduledSourcesRef.current.delete(source);
            if (scheduledSourcesRef.current.size === 0 && audioQueueRef.current.length === 0) {
                setAiSpeakingRef.current(false);
            }
        };

        const currentTime = ctx.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.01;
        }

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;

        const timeout = (nextStartTimeRef.current - ctx.currentTime) * 1000 - 40;
        playbackTimeoutRef.current = setTimeout(() => {
            playNextInQueue();
        }, Math.max(0, timeout));
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
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close().catch(() => { });
            inputAudioContextRef.current = null;
        }

        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close().catch(() => { });
            outputAudioContextRef.current = null;
        }

        if (sessionRef.current) {
            try {
                sessionRef.current.close();
            } catch (e) { }
            sessionRef.current = null;
        }
    }, [stopAudioPlayback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);

    // Resamples and converts Float32 audio to 16kHz 16-bit linear PCM
    const downsampleTo16kPCM = (input: Float32Array, inputRate: number): Int16Array => {
        if (inputRate === INPUT_SAMPLE_RATE) {
            const pcmData = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, input[i])) * 0x7FFF;
            }
            return pcmData;
        }

        const ratio = inputRate / INPUT_SAMPLE_RATE;
        const newLength = Math.round(input.length / ratio);
        const pcmData = new Int16Array(newLength);
        for (let i = 0; i < newLength; i++) {
            const originalIndex = Math.min(Math.round(i * ratio), input.length - 1);
            pcmData[i] = Math.max(-1, Math.min(1, input[originalIndex])) * 0x7FFF;
        }
        return pcmData;
    };

    const startMicStreaming = useCallback(() => {
        const ctx = inputAudioContextRef.current;
        if (!ctx || !streamRef.current) return;

        const source = ctx.createMediaStreamSource(streamRef.current);

        // 1. High-pass filter: cuts sub-100 Hz rumble
        const highpass = ctx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 100;
        highpass.Q.value = 0.7;

        // 2. Dynamics compressor: normalizes input speech
        const inputCompressor = ctx.createDynamicsCompressor();
        inputCompressor.threshold.value = -24;
        inputCompressor.knee.value = 10;
        inputCompressor.ratio.value = 4;
        inputCompressor.attack.value = 0.003;
        inputCompressor.release.value = 0.25;

        processorRef.current = ctx.createScriptProcessor(CHUNK_SIZE, 1, 1);

        processorRef.current.onaudioprocess = (e) => {
            if (isMutedRef.current || !sessionRef.current) return;

            const inputData = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
            setVolumeRef.current(Math.sqrt(sum / inputData.length));

            // Downsample and convert to 16kHz 16-bit PCM
            const pcmData = downsampleTo16kPCM(inputData, ctx.sampleRate);

            // Fast base64 encoding
            const bytes = new Uint8Array(pcmData.buffer);
            let binary = "";
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Data = btoa(binary);

            try {
                sessionRef.current.sendRealtimeInput({
                    audio: {
                        mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                        data: base64Data
                    }
                });
            } catch (err) {
                console.error("[useGeminiLive] Error sending audio input:", err);
            }
        };

        // Graph routing: Source -> Highpass -> Compressor -> Processor -> Silent Sink -> Destination
        source.connect(highpass);
        highpass.connect(inputCompressor);
        inputCompressor.connect(processorRef.current);

        // Required: Connect processor to destination via 0-gain sink to prevent browser GC
        const silentSink = ctx.createGain();
        silentSink.gain.value = 0;
        processorRef.current.connect(silentSink);
        silentSink.connect(ctx.destination);
    }, []);

    const startSession = useCallback(async () => {
        try {
            setError(null);
            setIsConnecting(true);
            isBufferingRef.current = true;
            accumulatedAiTextRef.current = "";

            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("Gemini API Key missing.");

            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;

            // 1. Output Audio Context (24 kHz)
            outputAudioContextRef.current = new AudioCtx({ sampleRate: OUTPUT_SAMPLE_RATE });
            if (outputAudioContextRef.current.state === "suspended") {
                await outputAudioContextRef.current.resume();
            }

            outputGainRef.current = outputAudioContextRef.current.createGain();
            outputGainRef.current.gain.value = 1.4;

            outputCompressorRef.current = outputAudioContextRef.current.createDynamicsCompressor();
            outputCompressorRef.current.threshold.value = -18;
            outputCompressorRef.current.knee.value = 6;
            outputCompressorRef.current.ratio.value = 3;
            outputCompressorRef.current.attack.value = 0.002;
            outputCompressorRef.current.release.value = 0.2;

            outputGainRef.current.connect(outputCompressorRef.current);
            outputCompressorRef.current.connect(outputAudioContextRef.current.destination);

            // 2. Input Audio Context (16 kHz)
            inputAudioContextRef.current = new AudioCtx({ sampleRate: INPUT_SAMPLE_RATE });
            if (inputAudioContextRef.current.state === "suspended") {
                await inputAudioContextRef.current.resume();
            }

            // Capture microphone
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: INPUT_SAMPLE_RATE,
                }
            });

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

            const ai = new GoogleGenAI({ apiKey });

            const sessionPromise = ai.live.connect({
                model: "gemini-3.1-flash-live-preview",
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setIsActive(true);
                        setIsConnecting(false);
                        nextStartTimeRef.current = 0;
                        startMicStreaming();
                        sessionRef.current?.sendRealtimeInput({
                            text: "[SYSTEM: Begin the interview now. Greet the candidate warmly by name, introduce yourself as Neura, and ask if they are ready to begin.]"
                        });
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const content = message.serverContent;
                        const msg = message as any;

                        // 1. Process User Transcriptions (Final & Interim)
                        if (content?.inputTranscription) {
                            onUserTranscriptionRef.current?.({
                                ...content.inputTranscription,
                                text: content.inputTranscription.text ?? "",
                                interim: false
                            });
                        } else if ((content as any)?.interimInputTranscription) {
                            onUserTranscriptionRef.current?.({
                                ...(content as any).interimInputTranscription,
                                text: (content as any).interimInputTranscription.text ?? "",
                                interim: true
                            });
                        } else if (msg.inputAudioTranscription) {
                            const isFinal = msg.inputAudioTranscription.isFinal ?? msg.inputAudioTranscription.is_final ?? true;
                            onUserTranscriptionRef.current?.({
                                ...msg.inputAudioTranscription,
                                interim: !isFinal
                            });
                        }

                        // 2. Process AI Text Transcriptions (Streaming Fragment Accumulator)
                        const outputTranscription = content?.outputTranscription || msg.outputAudioTranscription;
                        if (outputTranscription) {
                            const aiChunk = outputTranscription.text || (typeof outputTranscription === "string" ? outputTranscription : "");
                            if (aiChunk) {
                                accumulatedAiTextRef.current += aiChunk;
                                onMessageRef.current?.(aiChunk);

                                if (accumulatedAiTextRef.current.toLowerCase().includes("interview is completed")) {
                                    setIsInterviewCompletedRef.current?.(true);
                                }
                            }
                        }

                        // 3. Process AI Output Audio Chunks
                        if (content?.modelTurn?.parts) {
                            for (const part of content.modelTurn.parts) {
                                if (part.inlineData?.data) {
                                    const binaryString = atob(part.inlineData.data);
                                    const len = binaryString.length;
                                    const bytes = new Uint8Array(len);
                                    for (let i = 0; i < len; i++) {
                                        bytes[i] = binaryString.charCodeAt(i);
                                    }
                                    const pcm16 = new Int16Array(bytes.buffer);
                                    audioQueueRef.current.push(pcm16);

                                    if (isBufferingRef.current && audioQueueRef.current.length >= JITTER_BUFFER_SIZE) {
                                        isBufferingRef.current = false;
                                        if (!isPlayingRef.current) playNextInQueue();
                                    } else if (!isBufferingRef.current && !isPlayingRef.current) {
                                        playNextInQueue();
                                    }
                                }
                            }
                        }

                        // 4. Handle Interruption (User Barge-in)
                        if (content?.interrupted) {
                            console.log("[useGeminiLive] SERVER INTERRUPT RECEIVED");
                            accumulatedAiTextRef.current = "";
                            stopAudioPlayback();
                            onInterruptRef.current?.();
                        }

                        // 5. Turn Complete
                        if (content?.turnComplete) {
                            accumulatedAiTextRef.current = "";
                        }
                    },
                    onclose: () => stopSession(),
                    onerror: () => {
                        setError("Connection error.");
                        stopSession();
                    }
                }
            });

            sessionRef.current = await sessionPromise;
        } catch (err: any) {
            setError(err.message || "Failed to start session");
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