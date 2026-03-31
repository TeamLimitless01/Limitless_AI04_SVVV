"use client";

import React from "react";
import { motion } from "framer-motion";
import { Coffee, Eye, Activity, Heart, Frown } from "lucide-react";

type Props = {
    blinkRate?: number;
    confidence?: number;
    nervousness?: number;
    happy?: number;
    sad?: number;
};

export default function MetricsPanelCompact({
    blinkRate = 0,
    confidence = 0,
    nervousness = 0,
    happy = 0,
    sad = 0,
}: Props) {
    const clamp = (v: number) => Math.max(0, Math.min(1, v || 0));

    const metrics = [
        { 
            label: "Blink Rate", 
            value: blinkRate, 
            icon: Eye, 
            color: "text-blue-400", 
            bg: "bg-blue-500/10",
            suffix: ""
        },
        { 
            label: "Presence", 
            value: Math.round(clamp(confidence) * 100), 
            icon: Activity, 
            color: "text-emerald-400", 
            bg: "bg-emerald-500/10",
            suffix: "%"
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {metrics.map((m, i) => (
                <motion.div
                    key={m.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center justify-center p-4 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden group hover:bg-white/[0.05] transition-colors"
                >
                    <div className={`p-2.5 rounded-2xl ${m.bg} ${m.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <m.icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{m.label}</span>
                    <span className="text-xl font-black text-white mt-1 tabular-nums">
                        {m.value}{m.suffix}
                    </span>
                    
                    {/* Progress Indicator */}
                    {m.label === "Presence" && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/[0.03]">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${m.value}%` }}
                                className={`h-full ${m.bg.replace('/10', '')} shadow-[0_0_10px_rgba(16,185,129,0.2)]`}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
