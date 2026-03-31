import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import Navbar from "@/components/navbar";
import ToastProvider from "@/providers/ToastProvider";
import AuthProvider from "@/components/provider/next-auth-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import LightRays from "@/components/LightRay";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Neuraview | AI-Powered Mock Interviews",
    template: "%s | Neuraview",
  },
  description:
    "Master your next interview with Neuraview. Get real-time AI coaching, low-latency conversation practice, and personalized feedback to ace your placement.",
  keywords: [
    "AI Interviewer",
    "Mock Interview",
    "Career Preparation",
    "Interview Coaching",
    "Sarvam AI",
    "Tech Interview Prep",
    "Neuraview",
  ],
  authors: [{ name: "Neuraview Team" }],
  creator: "Neuraview",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://neuraview.vercel.app",
    siteName: "Neuraview",
    title: "Neuraview | AI-Powered Mock Interviews",
    description: "Practice interviews with AI-powered coaching. Get personalized feedback and ace your next interview.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Neuraview - Master Your Next Interview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Neuraview | AI-Powered Mock Interviews",
    description: "Master your next interview with real-time AI coaching and feedback.",
    images: ["/og-image.png"],
    creator: "@neuraview",
  },
  metadataBase: new URL("https://neuraview.vercel.app"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark antialiased`}
      suppressHydrationWarning={true}
    >
      <head>
        <meta name="google-site-verification" content="MiFErG-4RxFyw7PKeG5g4ERsXPAWGHzL9LkBpR4Zlew" />
      </head>
      
      <body className="font-sans scroll no-scrollbar relative min-h-screen">
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" />
        <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" />

        {/* Orb Background */}
        <div className=" fixed inset-0 z-[-1]">
          <LightRays
            raysOrigin="top-center"
            raysColor="#00ffff"
            raysSpeed={1.5}
            lightSpread={0.8}
            rayLength={1.2}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0.1}
            distortion={0.05}
            className="custom-rays"
          />
        </div>
        <AuthProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Suspense>
              <Navbar />
              <ToastProvider />
              <Script
                id="json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "Neuraview",
                    "applicationCategory": "EducationalApplication",
                    "operatingSystem": "Web",
                    "description": "Neuraview is an intelligent, high-fidelity mock interview platform designed to bridge the gap between preparation and placement.",
                    "offers": {
                      "@type": "Offer",
                      "price": "0",
                      "priceCurrency": "USD"
                    },
                    "author": {
                      "@type": "Organization",
                      "name": "Neuraview Team"
                    }
                  })
                }}
              />
              {/* <div className="h-20" aria-hidden /> */}
              {children}
              <Analytics />
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
