import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Sidebar } from "./components/Sidebar";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskScribe",
  description: "TaskScribe — Turn meeting transcripts into clear action items. Summary, tasks, and follow-up in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var v=(t==='light'||t==='dark')?t:d;document.documentElement.setAttribute('data-theme',v);})();`,
          }}
        />
      </head>
      <body className={`${plusJakarta.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
        <AuthProvider>
          <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
