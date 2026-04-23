import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const snap = await getDoc(doc(db, "reports", params.id));
  if (!snap.exists()) return { title: "Report Not Found" };
  const data = snap.data();
  return { title: `${data.scanType} Vulnerability Report - VulnAI` };
}

export default async function SharedReportPage({ params }: { params: { id: string } }) {
  const snap = await getDoc(doc(db, "reports", params.id));
  
  if (!snap.exists()) {
    notFound();
  }
  
  const report = snap.data();

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col font-inter">
      {/* Header */}
      <header className="border-b border-cyber-border bg-[#080b0f] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="VulnAI" width={32} height={32} className="rounded-lg group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all" />
            <span className="text-lg font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-cyber-muted uppercase tracking-widest hidden sm:inline-block">Generated on {new Date(report.createdAt).toLocaleDateString()}</span>
            <span className="bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest">{report.scanType}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 sm:p-10 shadow-2xl">
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
            <ReactMarkdown>{report.reportContent}</ReactMarkdown>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-cyber-muted">
          This report was securely generated via <Link href="/" className="text-cyber-cyan hover:underline">VulnAI</Link>.
        </div>
      </main>
    </div>
  );
}
