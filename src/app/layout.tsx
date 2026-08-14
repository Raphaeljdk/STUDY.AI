import type { Metadata } from "next";
import { Noto_Serif, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoSerifJP = Noto_Serif({
  variable: "--font-serif-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyAI — A beleza de aprender na imperfeição",
  description:
    "Plataforma de estudos com estetica Wabi-Sabi japonesa. Respeite seu ritmo natural de aprendizado com IA assistiva, flashcards espacados e tutor inteligente.",
  keywords: [
    "StudyAI",
    "estudos com IA",
    "aprendizado",
    "Wabi-Sabi",
    "tutor inteligente",
    "flashcards",
    "spaced repetition",
    "pomodoro",
    "estudar online",
    "plataforma de estudos",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "StudyAI — A beleza de aprender na imperfeição",
    description:
      "Plataforma de estudos com IA que respeita seu ritmo natural. Cadernos, flashcards, tutor IA e muito mais.",
    type: "website",
    locale: "pt_BR",
    siteName: "StudyAI",
    images: [{ url: "/studyai-logo.png", width: 512, height: 512, alt: "StudyAI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyAI — A beleza de aprender na imperfeição",
    description:
      "Revolucione seus estudos com IA. Wabi-Sabi: a perfeicao esta na jornada.",
    images: ["/studyai-logo.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "StudyAI",
    "application-name": "StudyAI",
    "msapplication-TileColor": "#fafaf9",
    "msapplication-tap-highlight": "no",
    "theme-color": "#92400e",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#92400e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StudyAI" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "StudyAI",
              "description": "Plataforma de estudos inteligentes com IA adaptativa",
              "url": "https://studyai.com.br",
              "sameAs": [],
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://studyai.com.br/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body
        className={`${notoSerifJP.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}
      >
        <a href="#main-content" className="skip-link">
          Pular para conteudo principal
        </a>
        <Providers>
          <div id="scroll-progress-bar" style={{ width: 0 }} />
          <main id="main-content">
            {children}
          </main>
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
