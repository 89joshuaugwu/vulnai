"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard's history tab
    router.replace("/dashboard?tab=history");
  }, [router]);

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
      <div className="text-cyber-cyan font-mono animate-pulse text-sm">Redirecting to Report History...</div>
    </div>
  );
}
