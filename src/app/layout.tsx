import type { Metadata, Viewport } from "next";
import { Noto_Serif, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { LoadingScreen } from "@/components/LoadingScreen";
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
  metadataBase: new URL('https://study-ai-nine-xi.vercel.app'),
  title: "StudyAI — A beleza de aprender na imperfeição",
  description:
    "Plataforma de estudos com estetica Wabi-Sabi japonesa. Respeite seu ritmo natural de aprendizado com IA assistiva, flashcards espacados e tutor inteligente.",
  alternates: {
    canonical: 'https://study-ai-nine-xi.vercel.app',
  },
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
    "IA para estudar",
    "resumir PDF com IA",
    "flashcards automaticos",
    "tutor IA",
    "plano de estudos",
    "micro aulas",
    "duelos de conhecimento",
    "app de estudos",
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F6F0' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1A1A' },
  ],
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StudyAI" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "StudyAI",
              "description": "Plataforma de estudos inteligentes com IA adaptativa. Cadernos, flashcards automáticos, tutor IA, plano de estudos e duelos de conhecimento.",
              "url": "https://study-ai-nine-xi.vercel.app",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL",
                "description": "Plano gratuito com funcionalidades essenciais"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1240"
              },
              "inLanguage": "pt-BR"
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
          <LoadingScreen />
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
