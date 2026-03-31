"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import Script from "next/script";
import MetricsPanel from "@/components/MetricsPanel";
import { motion } from "framer-motion";

interface EmotionData {
  timestamp: number;
  confidence: number;
  happy: number;
  sad: number;
  nervous: number;
  surprised: number;
  blink: number;
}

const VideoPreview = memo(function VideoPreview({ startFn, stopFn }: any) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const [running, setRunning] = useState(false);
  const [loaded, setLoaded] = useState(true);

  const [blinkRate, setBlinkRate] = useState(0);
  const [nervousness, setNervousness] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [surprised, setSurprised] = useState(0);
  const [happy, setHappy] = useState(0);
  const [sad, setSad] = useState(0);

  const blinkTimestampsRef = useRef<number[]>([]);
  const earHistoryRef = useRef<number[]>([]);
  const lastEmotionRef = useRef({
    happy: 0,
    sad: 0,
    nervous: 0,
    surprised: 0,
    confidence: 0,
    mar: 0,
    ear: 0,
    blink: 0,
    nose: 0,
  });

  const sessionDataRef = useRef<EmotionData[]>([]);

  const euclid = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
  const smooth = (prev: number, current: number, alpha = 0.3) =>
    prev * (1 - alpha) + current * alpha;

  const eyeAspectRatio = (lm: any, idxs: number[]) => {
    const [p0, p1, p2, p3, p4, p5] = idxs.map((i) => lm[i]);
    const A = euclid(p1, p5);
    const B = euclid(p2, p4);
    const C = euclid(p0, p3);
    return C === 0 ? 0 : (A + B) / (2 * C);
  };

  const mouthAspectRatio = (lm: any) => {
    const vertical = euclid(lm[13], lm[14]);
    const horizontal = euclid(lm[61], lm[291]);
    return horizontal === 0 ? 0 : vertical / horizontal;
  };

  const smileScore = (lm: any) => {
    const mouthWidth = euclid(lm[61], lm[291]);
    const mouthHeight = euclid(lm[13], lm[14]);
    const faceWidth = euclid(lm[234], lm[454]);
    if (!faceWidth) return 0;
    const ratio = (mouthWidth / faceWidth) * (mouthHeight / faceWidth) * 12;
    return Math.min(Math.max(ratio, 0), 1);
  };

  const headPose = (lm: any) => {
    const nose = lm[1];
    const centerX = (lm[234].x + lm[454].x) / 2;
    const centerY = (lm[152].y + lm[10].y) / 2;
    return { yaw: nose.x - centerX, pitch: nose.y - centerY };
  };

  const onResults = (results: any) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d")!;
    
    const containerWidth = canvas.parentElement?.clientWidth || 640;
    const containerHeight = canvas.parentElement?.clientHeight || 480;
    
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const localClamp = (v: number) => Math.max(0, Math.min(1, v));
    const lm = results.multiFaceLandmarks?.[0];
    
    if (!lm) {
      const currentConf = lastEmotionRef.current.confidence;
      const fluctuation = (Math.random() - 0.5) * 0.15;
      const targetConf = Math.max(0, currentConf - 0.1) + fluctuation;
      const finalConf = localClamp(targetConf);
      
      setConfidence(Number(finalConf.toFixed(2)));
      lastEmotionRef.current.confidence = finalConf;
      return;
    }

    const centerX = lm[1].x;
    const centerY = lm[1].y;
    const distFromCenter = Math.hypot(centerX - 0.5, centerY - 0.5);
    const alignmentPenalty = Math.max(0, distFromCenter - 0.2) * 2;
    
    const bounds = lm.reduce((acc: any, p: any) => ({
        minX: Math.min(acc.minX, p.x), maxX: Math.max(acc.maxX, p.x),
        minY: Math.min(acc.minY, p.y), maxY: Math.max(acc.maxY, p.y)
    }), { minX: 1, maxX: 0, minY: 1, maxY: 0 });
    
    const boundaryThreshold = 0.05;
    const isClipped = bounds.minX < boundaryThreshold || bounds.maxX > (1 - boundaryThreshold) ||
                      bounds.minY < boundaryThreshold || bounds.maxY > (1 - boundaryThreshold);
    
    const coverageScore = isClipped ? 0.6 : 1.0;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // @ts-ignore
    if (typeof drawConnectors !== 'undefined') {
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#3b82f6";
      
      // @ts-ignore
      drawConnectors(ctx, lm, FACEMESH_TESSELATION, {
        color: "rgba(255, 255, 255, 0.1)",
        lineWidth: 0.5,
      });
      // @ts-ignore
      drawConnectors(ctx, lm, FACEMESH_LEFT_EYE, { color: "#3b82f6", lineWidth: 1.5 });
      // @ts-ignore
      drawConnectors(ctx, lm, FACEMESH_RIGHT_EYE, { color: "#3b82f6", lineWidth: 1.5 });
      // @ts-ignore
      drawConnectors(ctx, lm, FACEMESH_LIPS, { color: "rgba(255, 255, 255, 0.3)", lineWidth: 1.5 });
      // @ts-ignore
      drawConnectors(ctx, lm, FACEMESH_FACE_OVAL, { color: "rgba(59, 130, 246, 0.4)", lineWidth: 1 });
      
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    const leftEAR = eyeAspectRatio(lm, [33, 160, 158, 133, 153, 144]);
    const rightEAR = eyeAspectRatio(lm, [263, 387, 385, 362, 380, 373]);
    const ear = (leftEAR + rightEAR) / 2;
    earHistoryRef.current.push(ear);
    if (earHistoryRef.current.length > 300) earHistoryRef.current.shift();

    const prevEar = earHistoryRef.current[earHistoryRef.current.length - 2] || ear;
    if (prevEar > 0.18 && ear <= 0.18) blinkTimestampsRef.current.push(Date.now());
    const oneMinuteAgo = Date.now() - 60000;
    blinkTimestampsRef.current = blinkTimestampsRef.current.filter((t) => t > oneMinuteAgo);
    const br = blinkTimestampsRef.current.length;
    setBlinkRate(br);

    const mar = mouthAspectRatio(lm);
    const smile = smileScore(lm);
    const pose = headPose(lm);
    const fHeight = euclid(lm[10], lm[152]) || 1;

    const blinkFeature = Math.min(br / 25, 1);
    const gazeAversion = Math.min(Math.hypot(pose.yaw, pose.pitch) / 0.2, 1);
    const currentNose = lm[1];
    const lastNose = lastEmotionRef.current.nose as any;
    const noseMovement = lastNose ? Math.hypot(currentNose.x - lastNose.x, currentNose.y - lastNose.y) / (fHeight * 0.1) : 0;
    const stabilityFeature = 1 - Math.min(noseMovement * 2, 1);

    const earMean = earHistoryRef.current.reduce((a, b) => a + b, 0) / (earHistoryRef.current.length || 1);
    const earStd = Math.sqrt(earHistoryRef.current.reduce((s, x) => s + (x - earMean) ** 2, 0) / (earHistoryRef.current.length || 1)) || 0.0001;
    const eyeWideFeature = Math.min(Math.max((ear - earMean) / (2 * earStd), 0), 1);

    const positivity = (0.5 * smile + 0.5 * stabilityFeature) * coverageScore;
    const negativity = 0.4 * gazeAversion + 0.3 * blinkFeature + alignmentPenalty;
    const jitter = (isClipped || alignmentPenalty > 0.2) ? (Math.random() - 0.5) * 0.08 : 0;
    
    const rawConf = localClamp((positivity - negativity + 1) / 2 + jitter);
    const finalConf = smooth(lastEmotionRef.current.confidence, rawConf, 0.15);
    setConfidence(Number(finalConf.toFixed(2)));

    const happyRaw = smooth(lastEmotionRef.current.happy, smile, 0.2);
    setHappy(Number(happyRaw.toFixed(2)));

    const nervousRaw = smooth(lastEmotionRef.current.nervous, (0.4 * gazeAversion + 0.4 * (1 - stabilityFeature) + 0.2 * blinkFeature), 0.1);
    setNervousness(Number(nervousRaw.toFixed(2)));

    const sadRaw = smooth(lastEmotionRef.current.sad, Math.max(0, 1 - happyRaw - (1 - nervousRaw) * 0.5), 0.1);
    setSad(Number(sadRaw.toFixed(2)));

    const rawSurprise = Math.min(1, 0.7 * eyeWideFeature + 0.3 * (mar > 0.4 ? 1 : 0));
    const finalSurprise = smooth(lastEmotionRef.current.surprised, rawSurprise, 0.2);
    setSurprised(Number(finalSurprise.toFixed(2)));

    lastEmotionRef.current = {
      happy: happyRaw,
      sad: sadRaw,
      nervous: nervousRaw,
      surprised: finalSurprise,
      confidence: finalConf,
      mar,
      ear,
      blink: br,
      nose: lm[1],
    };

    sessionDataRef.current.push({
      timestamp: Date.now(),
      confidence: finalConf,
      happy: happyRaw,
      sad: sadRaw,
      nervous: nervousRaw,
      surprised: finalSurprise,
      blink: br,
    });

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.roundRect(10, 10, 120, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(22, 22, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 10px sans-serif";
    ctx.fillText("LIVE ANALYSIS", 32, 25);
  };

  const generateFeedback = () => {
    const data = sessionDataRef.current;
    if (!data.length) return "No session data recorded.";

    const avg = (key: keyof EmotionData) =>
      data.reduce((sum, d) => sum + d[key], 0) / data.length;
    const feedback: string[] = [];

    const conf = avg("confidence");
    const nerv = avg("nervous");
    const happ = avg("happy");

    feedback.push(conf < 0.8 ? "Maintain eye contact and use open body language to project more confidence." : "Excellent confidence and technical presence displayed.");
    feedback.push(nerv > 0.2 ? "Focus on steady breathing to reduce visible signs of nervousness." : "You maintained a calm and composed demeanor throughout.");
    feedback.push(happ < 0.45 ? "Try to incorporate subtle, professional smiles to build rapport." : "Your friendly and approachable attitude was a key strength.");
    
    return feedback.join("\n");
  };

  const stop = () => {
    try {
      cameraRef.current?.stop();
    } catch {}
    setRunning(false);
    return generateFeedback();
  };

  const start = async () => {
    if (running || !loaded) return;
    const video = videoRef.current!;
    
    if (!faceMeshRef.current) {
      faceMeshRef.current = new (window as any).FaceMesh({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });
      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      faceMeshRef.current.onResults(onResults);
    }

    if (!cameraRef.current) {
      cameraRef.current = new (window as any).Camera(video, {
        onFrame: async () => await faceMeshRef.current.send({ image: video }),
        width: 1280,
        height: 720,
      });
    }

    try {
      await cameraRef.current.start();
      setRunning(true);
    } catch (err) {
      console.error("Camera access failed", err);
    }
  };

  useEffect(() => {
    startFn(() => start);
    stopFn(() => stop);
  }, [startFn, stopFn]);

  return (
    <div className="flex flex-col gap-6 h-full w-full">
       <div className="flex-1 relative flex items-center justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-black shadow-2xl group">
        <video ref={videoRef} className="hidden" playsInline></video>
        <canvas ref={canvasRef} className="w-full h-full object-cover"></canvas>
        
        {!running && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Waiting for camera...</p>
            </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs font-medium text-white/80">You are on camera</p>
        </div>
      </div>

      <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
      >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Real-time Analysis</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
            </div>
          </div>
          <MetricsPanel
              blinkRate={blinkRate}
              confidence={confidence}
              nervousness={nervousness}
              happy={happy}
              sad={sad}
          />
      </motion.div>
    </div>
  );
});

export default VideoPreview;
