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

            const systemInstruction = `
You are Neuraview, a real-time AI interviewer.
INTERVIEW DETAILS:
Role: ${interviewDetails.topic}
Difficulty: ${interviewDetails.difficulty}
Candidate: ${interviewDetails.username} (greet user with this name)
Language: ${interviewDetails.interviewLanguage} (talk strickly in this language and if user speak different language tell him to start interview in that language again)
Skills: ${interviewDetails.skills}
Resume: ${interviewDetails.resume}


RULES:
- 
- This is a continuous live call.
- Be extremely conversational and human-sounding.
- Keep responses short (under 3 sentences) to allow for natural back-and-forth.
- If interrupted, stop immediately and listen.
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

    return {
        isActive,
        isConnecting,
        error,
        startSession,
        stopSession,
        session: sessionRef.current
    };
}
