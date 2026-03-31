"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SarvamTTSOptions {
    voiceId?: string;
    languageCode?: string;
}

export function useSarvamStreamingTTS(options?: SarvamTTSOptions) {
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userInteracted, setUserInteracted] = useState(false);

    // Audio Playback State
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<AudioBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const nextStartTimeRef = useRef(0);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Streaming & Sequence State
    const abortControllerRef = useRef<AbortController | null>(null);
    const nextSequenceIdRef = useRef(0);
    const expectedSequenceIdRef = useRef(0);
    const pendingAudioChunksRef = useRef<Map<number, AudioBuffer>>(new Map());
    const currentSessionIdRef = useRef(0);

    // Initialize AudioContext
    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                latencyHint: 'interactive',
                sampleRate: 22050
            });
            nextStartTimeRef.current = audioContextRef.current.currentTime;
        }
        if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
        }
    }, []);

    const playNextChunk = useCallback(() => {
        if (!audioContextRef.current || audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            return;
        }

        isPlayingRef.current = true;
        setIsPlaying(true);

        const buffer = audioQueueRef.current.shift()!;
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        currentSourceRef.current = source;

        const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            if (currentSourceRef.current === source) {
                currentSourceRef.current = null;
            }
            playNextChunk();
        };
    }, []);

    const processSequenceQueue = useCallback(() => {
        while (pendingAudioChunksRef.current.has(expectedSequenceIdRef.current)) {
            const buffer = pendingAudioChunksRef.current.get(expectedSequenceIdRef.current)!;
            pendingAudioChunksRef.current.delete(expectedSequenceIdRef.current);
            audioQueueRef.current.push(buffer);
            expectedSequenceIdRef.current++;
        }

        if (!isPlayingRef.current) {
            playNextChunk();
        }
    }, [playNextChunk]);

    const streamSentence = useCallback(async (text: string, seqId: number, sessionId: number) => {
        if (!text) return;
        initAudio();
        setIsLoading(true);

        const API_KEY = "sk_gq7o64gi_PSgHBegik8dSJUvCVctMkp2W";
        const API_URL = "https://api.sarvam.ai/text-to-speech/stream";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "api-subscription-key": API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: text,
                    target_language_code: options?.languageCode || "en-IN",
                    speaker: "shubh",
                    model: "bulbul:v3",
                    pace: 1.1,
                    speech_sample_rate: 22050,
                    output_audio_codec: "mp3",
                    enable_preprocessing: true
                }),
                signal: abortControllerRef.current?.signal
            });

            if (!response.ok || !response.body) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Check if sessionId is still valid after fetch (interrupt check)
            if (sessionId !== currentSessionIdRef.current) return;

            const reader = response.body.getReader();
            let chunks: Uint8Array[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                }
            }

            // Check if sessionId is still valid after reading stream
            if (sessionId !== currentSessionIdRef.current) return;

            // Combine chunks into a single ArrayBuffer for decoding
            const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }

            if (audioContextRef.current) {
                const audioBuffer = await audioContextRef.current.decodeAudioData(combined.buffer);

                // Re-check valid session
                if (sessionId === currentSessionIdRef.current) {
                    pendingAudioChunksRef.current.set(seqId, audioBuffer);
                    processSequenceQueue();
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error("Sarvam HTTP Streaming error:", err);
            // We don't set error state here to avoid breaking the whole UI if one chunk fails
            // but you might want to handle it.
        } finally {
            if (sessionId === currentSessionIdRef.current) {
                setIsLoading(false);
            }
        }
    }, [options?.languageCode, processSequenceQueue, initAudio]);

    const queueText = useCallback((text: string) => {
        const seqId = nextSequenceIdRef.current++;
        streamSentence(text, seqId, currentSessionIdRef.current);
    }, [streamSentence]);

    const stop = useCallback(() => {
        // 1. Invalidate current session
        currentSessionIdRef.current++;

        // 2. Abort pending fetches
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // 3. Stop currently playing source
        if (currentSourceRef.current) {
            try {
                currentSourceRef.current.stop();
            } catch (e) { }
            currentSourceRef.current = null;
        }

        // 4. Clear queues and trackers
        audioQueueRef.current = [];
        pendingAudioChunksRef.current.clear();
        nextSequenceIdRef.current = 0;
        expectedSequenceIdRef.current = 0;
        isPlayingRef.current = false;
        setIsPlaying(false);

        // 5. Reset timing
        if (audioContextRef.current) {
            nextStartTimeRef.current = audioContextRef.current.currentTime;
        }
    }, []);

    const unlockPlayback = useCallback(() => {
        setUserInteracted(true);
        initAudio();
    }, [initAudio]);

    const flush = useCallback(() => {
        // Implicit in fetch-based per-sentence streaming
    }, []);

    // Cleanup
    useEffect(() => {
        abortControllerRef.current = new AbortController();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        queueText,
        flush,
        stop,
        unlockPlayback,
        isLoading,
        isPlaying,
        error,
        userInteracted,
    };
}
