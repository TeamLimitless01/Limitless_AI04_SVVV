import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useState, useEffect, useRef, useCallback } from "react";

// Audio constants
const SAMPLE_RATE = 24000;
const CHUNK_SIZE = 1024;
const JITTER_BUFFER_SIZE = 3;

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

        // Use a GainNode for smoother stopping if needed, but direct connect is fine for fragments
        source.connect(audioContextRef.current.destination);
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
        if (!audioContextRef.current || !streamRef.current) return;

        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        processorRef.current = audioContextRef.current.createScriptProcessor(CHUNK_SIZE, 1, 1);

        processorRef.current.onaudioprocess = (e) => {
            if (isMutedRef.current) return;

            const inputData = e.inputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
            setVolumeRef.current(Math.sqrt(sum / inputData.length));

            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }

            const uint8Array = new Uint8Array(pcmData.buffer);
            let binary = '';
            for (let i = 0; i < uint8Array.byteLength; i++) binary += String.fromCharCode(uint8Array[i]);
            const base64Data = btoa(binary);

            sessionPromise.then((session) => {
                try {
                    session.sendRealtimeInput({
                        audio: {
                            mimeType: 'audio/pcm;rate=24000',
                            data: base64Data
                        }
                    });
                } catch (err) {
                    console.error("[useGeminiLive] Error sending audio input:", err);
                }
            });
        };

        source.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
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

            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            const ai = new GoogleGenAI({ apiKey });

            const sanitize = (text: string) =>
                text?.replace(/[<>{}[\]]/g, "").slice(0, 1000) ?? "Not provided";

            const getModePrompt = (mode: string) => {
                const modes: Record<string, string> = {
                    hr: `
## YOUR ROLE
You are Neura, a warm and perceptive HR interviewer. You care about culture fit, self-awareness, and communication — not technical depth.

## QUESTION STRATEGY
- Ask exclusively behavioral questions. Use STAR probing: Situation, Task, Action, Result.
- After every answer, dig into the Action layer: "What did YOU specifically do — not the team?"
- Push on failure and conflict: "Tell me about a time things went wrong."
- Never ask anything technical. If candidate goes technical, redirect: "Help me understand the people side of that."
- If an answer is vague, push back: "Can you give me a concrete example?"

## TONE
- Warm but not a pushover. Normalize pauses: "Take your time."
- Mirror their energy — if nervous, slow down and be warmer.`,

                    technical: `
## YOUR ROLE
You are Neura, a senior engineer. You are neutral, precise, and Socratic. You do not give hints. You do not react warmly to answers — you probe them.

## QUESTION STRATEGY
- Before they solve anything: "Walk me through your approach first."
- After every answer, attack the edges: "What's the time complexity?", "What breaks at 10x scale?", "Why not use X instead?"
- If they get something wrong, don't correct — probe: "Are you confident about that? Walk me through it again."
- If they're breezing through, escalate — add constraints, change requirements mid-problem.
- Candidate should be talking 70% of the time.

## TONE
- Neutral poker face. No "great" or "interesting" — just "okay", "got it", "continue".
- Don't fill pauses. Let them sit with hard questions.`,

                    "system-design": `
## YOUR ROLE
You are Neura, a staff engineer. This is an open-ended Socratic discussion — no right answers, only tradeoffs.

## QUESTION STRATEGY
- Open with a broad, ambiguous prompt and let them drive.
- After each component they mention, probe tradeoffs: "Why that choice? What does it cost you?"
- Introduce curveballs mid-discussion: "Now the client wants real-time analytics. How does that change things?"
- Push back on every confident claim: "What's the failure mode here?"

## TONE
- Intellectually collaborative but challenging — like a whiteboard session with a skeptical senior.
- Affirm direction without affirming correctness: "Okay, let's go there — now what?"`,
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
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const msg = message as any;

                        if (message.serverContent?.inputTranscription) {
                            onUserTranscriptionRef.current?.(message.serverContent.inputTranscription);
                        } else if (msg.inputAudioTranscription) {
                            onUserTranscriptionRef.current?.(msg.inputAudioTranscription);
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
        sessionRef.current.sendClientContent({
            turns: [{ role: "user", parts: [{ text }] }],
            turnComplete: true
        });
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
