# 🎙️ Neuraview: The Future of AI Mock Interviews

**Neuraview** is an intelligent, high-fidelity mock interview platform designed to bridge the gap between preparation and placement. By leveraging advanced LLMs and interactive UI components, Neuraview provides a realistic, high-pressure, yet encouraging environment for candidates to hone their skills.

---

## ✨ Current Core Features
- **AI-Driven Interviews**: Context-aware interviewers that adapt to your role, skills, and difficulty level.
- **Ultra-Low Latency (Sarvam AI)**: Optimized STT/TTS WebSocket pipeline for a near-instant, "human" conversation feel (<1.2s lag).
- **Pause-as-Trigger**: No "push-to-talk" needed. The AI detects natural thinking pauses and responds automatically.
- **Real-time Feedback**: Get instant analysis on your responses (via Integrated Reports).
- **Interactive Dashboards**: Track your progress and view generated learning roadmaps.
- **Premium UI/UX**: Cinematic animations, mic-visualizers, and AI speaking indicators (Orb.tsx) for a truly immersive experience.

---

## 🚀 Extended Roadmap: Future Features & Value-Add
*These features are planned to extend the project's value for professional and enterprise use.*

### 🧠 Intelligence & Deep Analysis
- **Multimodal Behavioral Feedback**: Using vision models to analyze eye contact, facial cues, and body language.
- **Confidence Scoring**: Audio-based sentiment analysis to detect hesitation and tone modulation.
- **Deep Resume Parsing**: Automatically tailoring questions based on a user's uploaded PDF resume.

### 💻 Technical Specialist Tools
- **Integrated Code Sandbox**: A real-time Monaco editor where the AI can watch you solve algorithms and provide deep architectural critiques.
- **System Design Whiteboard**: Interactive canvas for drawing architectural diagrams during senior-level interviews.
- **Company Personas**: Mode-specific interviews for Google, Amazon, Meta, and Netflix styles.

### 📈 Product Growth & Gamification
- **Job Match Engine**: Score-based job recommendations linking candidates to real-world opportunities.
- **AI Panel Interviews**: Multiple AI agents (HR, Tech Lead, Product) roleplaying simultaneously.
- **Peer-to-Peer Mock Modes**: Practice with friends while the AI acts as a referee and generates a joint report.

---

## 🛠 Tech Stack
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **AI Engine**: [Sarvam AI](https://www.sarvam.ai/) / [Google Gemini](https://ai.google.dev/)
- **State Management**: React Hooks & Context API
- **UI Components**: Shadcn/UI + Custom Animated Components (Aceternity-inspired)

---

## 🚦 Getting Started

1. **Clone the repo**:
   ```bash
   git clone https://github.com/your-repo/neuraview.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Environment Variables**:
   Create a `.env.local` file with:
   ```env
   AI_API_TOKEN_POLLINATIONS=your_token_here
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing
Neuraview is open to extensions! Check out `EXTENSIONS.md` for a detailed breakdown of how you can contribute to the future of AI recruitment.
