"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseMurfTTSOptions {
  voiceId?: string;
  format?: "mp3" | "wav";
}

export function useMurfTTS(options?: UseMurfTTSOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);


  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // If browser blocks play() this will hold the Audio element waiting to be played after a user gesture
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Attach a one-time user interaction listener to attempt play of pending audio
  useEffect(() => {
    if (userInteracted) return;

    const onUserInteract = () => {
      setUserInteracted(true);

      // if there's pending audio, try to play it now
      if (pendingAudioRef.current) {
        pendingAudioRef.current
          .play()
          .then(() => {
            // success
          })
          .catch((err) => {
            console.error("Play after user interaction failed:", err);
          })
          .finally(() => {
            pendingAudioRef.current = null;
          });
      }

      // remove listeners since we only need first gesture
      window.removeEventListener("click", onUserInteract);
      window.removeEventListener("keydown", onUserInteract);
      window.removeEventListener("touchstart", onUserInteract);
    };

    window.addEventListener("click", onUserInteract, { once: true });
    window.addEventListener("keydown", onUserInteract, { once: true });
    window.addEventListener("touchstart", onUserInteract, { once: true });

    return () => {
      window.removeEventListener("click", onUserInteract);
      window.removeEventListener("keydown", onUserInteract);
      window.removeEventListener("touchstart", onUserInteract);
    };
  }, [userInteracted]);

  const generateSpeech = useCallback(
    async (text: string) => {
      if (!text) return;
      setIsLoading(true);
      setError(null);

      try {
        /*  const response = await fetch("https://api.murf.ai/v1/speech/stream", {
           method: "POST",
           headers: {
             // move your API key to env/secure location in production
             "api-key": "ap2_fdf1c778-42f0-4b14-84f9-fe9afa7aeb72",
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             text,
             voiceId: options?.voiceId || "en-US-natalie",
           }),
         });
 
         if (!response.ok) {
           throw new Error(`Murf API error: ${response.status}`);
         }
 
         const audioBlob = await response.blob();
 
         // revoke previous url if present
         if (objectUrlRef.current) {
           try {
             URL.revokeObjectURL(objectUrlRef.current);
           } catch {}
           objectUrlRef.current = null;
         }
 
         const audioSrc = URL.createObjectURL(audioBlob);
         objectUrlRef.current = audioSrc;
 
         // stop any currently playing audio
         if (audioRef.current) {
           audioRef.current.pause();
           audioRef.current = null;
         }
 
         const audio = new Audio(audioSrc);
         audioRef.current = audio;
 
         audio.onplay = () => setIsPlaying(true);
         audio.onended = () => setIsPlaying(false);
         audio.onerror = () => setError("Playback error");
 
         try {
          
           await audio.play();
           // played successfully
           pendingAudioRef.current = null;
         } catch (err: any) {
           // Browser blocked autoplay - queue for play after user gesture
           if (err instanceof DOMException && err.name === "NotAllowedError") {
             pendingAudioRef.current = audio;
             console.warn("Autoplay blocked — queued audio until user interaction.");
           } else {
             // other playback error
             console.error("Playback failed:", err);
             setError(err?.message || "Playback failed");
           }
         } */
        const response = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "api-subscription-key": "sk_gq7o64gi_PSgHBegik8dSJUvCVctMkp2W",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "text": text,
            "target_language_code": "en-IN",
            "speaker": "ritu",
            "model": "bulbul:v3",
            "pace": 1,
            "speech_sample_rate": 22050,
            "output_audio_codec": "mp3",
            "enable_preprocessing": true
          }),
        })

        console.log("Response", response)
        if (!response.ok) {
          throw new Error("Failed to generate audio")
        }

        const data = await response.json()
        const base64Audio = data.audios[0]
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.play();
      } catch (err: any) {
        console.error("TTS error:", err);
        setError(err?.message || "TTS generation failed");
      } finally {
        setIsLoading(false);
      }
    },
    [options?.voiceId]
  );

  // Expose a function you can call from a user gesture (button click) to unlock playback
  const unlockPlayback = useCallback(() => {
    setUserInteracted(true);
    if (pendingAudioRef.current) {
      pendingAudioRef.current
        .play()
        .catch((err) => console.error("Failed to play pending audio:", err))
        .finally(() => {
          pendingAudioRef.current = null;
        });
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    // revoke pending url as well
    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch { }
      objectUrlRef.current = null;
    }
    pendingAudioRef.current = null;
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (objectUrlRef.current) {
        try {
          URL.revokeObjectURL(objectUrlRef.current);
        } catch { }
        objectUrlRef.current = null;
      }
      pendingAudioRef.current = null;
    };
  }, []);

  return {
    generateSpeech,
    stop,
    unlockPlayback, // call this from a button click if you want explicit control
    isLoading,
    isPlaying,
    setIsLoading,
    error,
    userInteracted,
  };
}
