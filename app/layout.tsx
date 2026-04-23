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
              background: "#0D1117",
              color: "#C9D1D9",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              boxShadow: "0 0 15px rgba(0, 212, 255, 0.1)",
              borderRadius: "12px",
            },
            success: {
              iconTheme: {
                primary: "#2EA043",
                secondary: "#0D1117",
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
