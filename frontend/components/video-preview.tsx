"use client";

import React, { memo, useEffect, useRef, useState } from "react";

interface VideoPreviewProps {
  pipMode?: boolean;
}

const VideoPreview = memo(function VideoPreview({
  pipMode = false,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [running, setRunning] = useState(false);
  const [personDetected, setPersonDetected] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    type FaceMeshInstance = {
      setOptions: (options: Record<string, number | boolean>) => void;
      onResults: (callback: (results: { multiFaceLandmarks?: unknown[] }) => void) => void;
      send: (input: { image: HTMLVideoElement }) => Promise<void>;
      close: () => void;
    };
    let stream: MediaStream | null = null;
    let faceMesh: FaceMeshInstance | null = null;
    let animationFrameId: number | null = null;
    let lastFrameTime = 0;
    let processingFrame = false;
    let detectionFailed = false;

    const startCamera = async () => {
      try {
        const mediaPipe = window as typeof window & {
          FaceMesh?: new (options: { locateFile: (file: string) => string }) => FaceMeshInstance;
        };

        if (!mediaPipe.FaceMesh) {
          throw new Error("Camera detection is unavailable. Please refresh and try again.");
        }

        faceMesh = new mediaPipe.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: false,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        let lastPresence: boolean | null = null;
        faceMesh.onResults((results) => {
          const detected = Boolean(results.multiFaceLandmarks?.length);
          if (!cancelled && detected !== lastPresence) {
            lastPresence = detected;
            setPersonDetected(detected);
          }
        });

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          faceMesh.close();
          return;
        }

        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setRunning(true);

        const processFrame = (timestamp: number) => {
          if (cancelled || detectionFailed) return;
          if (
            faceMesh &&
            !processingFrame &&
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            timestamp - lastFrameTime >= 200
          ) {
            lastFrameTime = timestamp;
            processingFrame = true;
            void faceMesh
              .send({ image: video })
              .catch((error) => {
                if (cancelled) return;
                detectionFailed = true;
                console.error("Camera person detection failed", error);
                setCameraError("Person detection failed. Please turn the camera off and try again.");
              })
              .finally(() => {
                processingFrame = false;
              });
          }
          animationFrameId = requestAnimationFrame(processFrame);
        };

        animationFrameId = requestAnimationFrame(processFrame);
      } catch (error) {
        if (cancelled) return;
        stream?.getTracks().forEach((track) => track.stop());
        faceMesh?.close();
        console.error("Camera access failed", error);
        setCameraError(
          error instanceof Error ? error.message : "Could not start the camera."
        );
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      stream?.getTracks().forEach((track) => track.stop());
      faceMesh?.close();
      video.srcObject = null;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      <div
        className={`flex-1 relative flex items-center justify-center overflow-hidden ${
          pipMode ? "rounded-none" : "rounded-[2.5rem]"
        } border border-white/10 bg-black shadow-2xl`}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover -scale-x-100"
          autoPlay
          muted
          playsInline
        />

        {!running && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <p className="text-white/40 text-sm font-medium tracking-widest uppercase">
              Starting camera...
            </p>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-3">
            <p role="alert" className="text-center text-xs text-red-300">
              {cameraError}
            </p>
          </div>
        )}

        {running && (
          <div className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-semibold text-white/75">
            {personDetected ? "Person detected" : "No person detected"}
          </div>
        )}
      </div>
    </div>
  );
});

export default VideoPreview;
