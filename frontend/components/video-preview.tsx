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
    let camera: { start: () => Promise<void>; stop: () => void } | null = null;
    let faceMesh: FaceMeshInstance | null = null;

    const startCamera = async () => {
      try {
        const mediaPipe = window as typeof window & {
          FaceMesh?: new (options: { locateFile: (file: string) => string }) => FaceMeshInstance;
          Camera?: new (
            video: HTMLVideoElement,
            options: {
              onFrame: () => Promise<void>;
              width: number;
              height: number;
            }
          ) => { start: () => Promise<void>; stop: () => void };
        };

        if (!mediaPipe.FaceMesh || !mediaPipe.Camera) {
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
          if (detected !== lastPresence) {
            lastPresence = detected;
            setPersonDetected(detected);
          }
        });

        camera = new mediaPipe.Camera(video, {
          onFrame: async () => {
            if (faceMesh && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              await faceMesh.send({ image: video });
            }
          },
          width: 1280,
          height: 720,
        });

        await camera.start();
        if (cancelled) {
          camera.stop();
          faceMesh.close();
          return;
        }
        setRunning(true);
      } catch (error) {
        if (cancelled) return;
        camera?.stop();
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
      camera?.stop();
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
