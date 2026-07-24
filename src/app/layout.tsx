import type { Metadata } from "next";
import { Noto_Serif_JP, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-serif-jp",
  subsets: ["latin", "japanese"],
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
    "Plataforma de estudos com estética Wabi-Sabi japonesa. Respeite seu ritmo natural de aprendizado com IA assistiva.",
  keywords: [
    "StudyAI",
    "estudos",
    "IA",
    "aprendizado",
    "Wabi-Sabi",
    "tutor inteligente",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${notoSerifJP.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="washi-paper"
          themes={[
            "washi-paper",
            "sumi-ink",
            "koke-ishi",
            "momiji",
            "sakura",
          ]}
          enableSystem={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
