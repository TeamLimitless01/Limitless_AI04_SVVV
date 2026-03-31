'use client'

import { useState } from "react"

export default function TTSPage() {
    const [text, setText] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value)
    }

    const handleGenerateAudio = async () => {
        setLoading(true)
        setError("")
        try {
            const response = await fetch("https://api.sarvam.ai/text-to-speech", {
                method: "POST",
                headers: {
                    "api-subscription-key": "sk_gq7o64gi_PSgHBegik8dSJUvCVctMkp2W",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "text": "Along with that, I’ve also worked on AI-powered applications where I integrated AI models into web apps to build smarter and more interactive systems. I’m interested in combining traditional software development with AI to create scalable and future-ready products.",
                    "target_language_code": "hi-IN",
                    "speaker": "ritu",
                    "model": "bulbul:v3",
                    "pace": 0.95,
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
        } catch (error: any) {
            setError(error?.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-center align-center w-100 h-100">
            <h1>TTS</h1>
            <textarea value={text} onChange={handleTextChange} />
            <button onClick={handleGenerateAudio} disabled={loading}>
                {loading ? "Generating..." : "Generate Audio"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    )
}