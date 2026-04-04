"use client";

import { memo } from "react";
import { Mic, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

interface InterviewHeaderProps {
  id: string;
  speechEnabled: boolean;
  setSpeechEnabled: (v: boolean) => void;
  status?: "connecting" | "active" | "idle";
}

const InterviewHeader = memo(({ id, speechEnabled, setSpeechEnabled, status = "idle" }: InterviewHeaderProps) => {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between mb-6 w-full relative z-50">
      <div className="flex-1 flex justify-start">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-all duration-500 ${status === 'active' ? 'from-emerald-500 to-teal-600 shadow-emerald-500/20' : status === 'connecting' ? 'from-blue-500 to-purple-600 animate-pulse shadow-blue-500/20' : 'from-gray-600 to-gray-700 shadow-white/5'}`}>
              <Mic className="text-white w-5 h-5" />
            </div>
            {status === 'active' && (
              <div className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Interview Session</h1>
              {status === 'active' && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500 text-white animate-pulse">LIVE</span>
              )}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Session ID: {id.slice(0, 8)}...</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-end gap-4">
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
          <Label htmlFor="speech-mode" className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors cursor-pointer">
            AI Voice
          </Label>
          <Switch
            id="speech-mode"
            checked={speechEnabled}
            onCheckedChange={setSpeechEnabled}
          />
        </div>
        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" onClick={() => router.push('/dashboard')}>
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>
    </header>
  );
});

InterviewHeader.displayName = "InterviewHeader";
export default InterviewHeader;
