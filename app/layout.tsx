import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "VulnAI — AI Vulnerability Report Generator",
  description:
    "Paste scan output, get professional pentest reports instantly. Powered by Google Gemini AI.",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#161B22",
              color: "#C9D1D9",
              border: "1px solid #30363D",
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: "13px",
            },
            iconTheme: {
              primary: "#00D4FF",
              secondary: "#161B22",
            },
            success: {
              iconTheme: {
                primary: "#3FB950",
                secondary: "#161B22",
              },
            },
            error: {
              iconTheme: {
                primary: "#F85149",
                secondary: "#161B22",
              },
            },
          }}
        />
        </AuthProvider>
      </body>
    </html>
  );
}
