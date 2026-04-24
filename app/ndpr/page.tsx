import Link from "next/link";
import Image from "next/image";

export default function NDPRCompliancePage() {
  return (
    <div className="min-h-screen bg-cyber-bg flex flex-col">
      <nav className="border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="VulnAI" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold"><span className="text-white">Vuln</span><span className="text-cyber-cyan">AI</span></span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-cyber-muted hover:text-cyber-cyan transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-grow px-6 py-16">
        <div className="mx-auto max-w-4xl bg-cyber-card border border-cyber-border rounded-xl p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyber-cyan mb-6">
            Compliance Framework
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">NDPR Compliance</h1>
          <p className="text-sm text-cyber-muted mb-12">Commitment to the Nigerian Data Protection Regulation (NDPR)</p>

          <div className="space-y-8 text-cyber-muted leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Our Commitment</h2>
              <p>VulnAI is fully committed to complying with the Nigeria Data Protection Regulation (NDPR) issued by the National Information Technology Development Agency (NITDA). We prioritize the privacy and security of Nigerian enterprise data, financial institutions, and individual users.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Data Subject Rights</h2>
              <p>Under the NDPR, our users have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li><strong>Access:</strong> Request access to the personal data we hold about you.</li>
                <li><strong>Rectification:</strong> Correct any inaccurate or incomplete data.</li>
                <li><strong>Erasure (Right to be Forgotten):</strong> Request the permanent deletion of your data and report history.</li>
                <li><strong>Portability:</strong> Receive your data in a structured, commonly used format.</li>
              </ul>
              <p className="mt-4">You can exercise these rights directly from your VulnAI Dashboard or by contacting our Data Protection Officer.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Data Processing & Consent</h2>
              <p>We process data only when there is a lawful basis, typically user consent. Consent is explicitly requested during sign-up and when sensitive scan data is uploaded for AI analysis. Users have the right to withdraw consent at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Security Measures</h2>
              <p>To comply with NDPR requirements for data security, VulnAI implements AES-256 encryption at rest, TLS 1.3 in transit, automated session timeouts, Multi-Factor Authentication (OTP), and robust rate limiting to prevent unauthorized access.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
