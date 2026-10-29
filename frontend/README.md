# 🖱️ NeuraView: The Frontend Interface

This is the high-performance Next.js 14 frontend for **NeuraView**, an AI-powered mock interview and career preparation platform. It uses React's modern patterns, cinematic animations (Framer Motion), and sophisticated integrations (Sarvam AI, Face Mesh) to provide a premium user experience.

---

## ✨ Features Spotlight

- **🎙️ Real-time Voice Interaction**: Optimized Sarvam AI streaming STT/TTS with ultra-low latency (<1.2s lag).
- **👁️ Face Mesh Analysis**: On-device facial expression analysis using TensorFlow.js for behavioral cues.
- **📄 Document Intelligence UI**: Sleek interfaces for uploading, processing, and interacting with AI-parsed resumes and study materials.
- **📊 Interactive Analytics**: High-quality data visualization for interview reports using Recharts.
- **✨ Cinematic UX**: Custom glassmorphic components, light rays, and animated orbs inspired by high-end design languages like Aceternity UI.

---

## 🛠 Frontend Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion + Motion One
- **UI Components**: Shadcn/UI (Radix UI)
- **AI Clients**: Sarvam AI SDK, Pollinations AI (via custom fetch)
- **Auth**: NextAuth.js
- **Icons**: Lucide-React + Tabler Icons

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file in this directory and populate it with your API keys:

```env
# AI API Keys
NEXT_PUBLIC_SARVAM_API_KEY=your_sarvam_key
AI_API_TOKEN_POLLINATIONS=your_pollinations_token
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
ADZUNA_COUNTRY=in

# Backend URL (Strapi)
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# Auth
NEXTAUTH_SECRET=your_nextauth_secret
SITE_BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Google/Gmail SMTP for signup welcome emails (server-side only)
GOOGLE_APP_NAME=NeuraView
GOOGLE_APP_EMAIL=your-gmail-address@gmail.com
GOOGLE_APP_PASSWORD=your-google-app-password
```

For Google sign-in, create a Google OAuth 2.0 Web application client and add
`http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
Use the value of `SITE_BASE_URL` followed by `/api/auth/callback/google` as the
authorized redirect URI for each environment. Keep the OAuth client secret
server-side. The legacy `NEXTAUTH_URL` remains supported if
`SITE_BASE_URL` is unset. The legacy variable names `OATH_CLIENT_ID` and
`OATH_CLIENT_SECRET` are also accepted, but the `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` names above are preferred.

`GOOGLE_APP_EMAIL` must be the Gmail account used to authenticate and send mail;
`GOOGLE_APP_NAME` is only the display name. Generate an app password in your
Google Account and keep it only in `.env.local` or your deployment's encrypted
environment settings. For existing SMTP setups, `SMTP_USER` and `SMTP_PASSWORD`
are accepted as credential fallbacks. The mail host defaults to Gmail
(`smtp.gmail.com`, port `465`); `SMTP_HOST` and `SMTP_PORT` can override these
non-secret connection settings. Welcome-email delivery is best-effort: signup
still succeeds if SMTP is temporarily unavailable.

Career Hub uses the Adzuna API (not HTML scraping) as its sole job-listing source. Keep the Adzuna credentials server-side
(do not prefix them with `NEXT_PUBLIC_`). `ADZUNA_COUNTRY` selects the Adzuna
market and defaults to `in`; supported markets are `at`, `au`, `be`, `br`,
`ca`, `ch`, `de`, `es`, `fr`, `gb`, `in`, `it`, `mx`, `nl`, `nz`, `pl`, `sg`,
`us`, and `za`.

### 3. Run Development Server
```bash
npm run dev
```

---

## 🏗 Key Components Architecture

- **`components/Orb.tsx`**: High-performance AI interaction visualizer.
- **`components/video-preview.tsx`**: Real-time camera capture + Face Mesh analytics processing.
- **`app/interview/[id]/useSarvamStreamingTTS.ts`**: Custom hook for low-latency audio streaming logic.
- **`app/api/interview/report/route.ts`**: Server-side report orchestration using Pollinations AI.

---

## 🛣 Roadmap & Extensions
Check out `EXTENSIONS.md` for ideas on how to extend the technical features of the NeuraView frontend.

---

Created with ❤️ by **Team Limitless**.
