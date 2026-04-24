"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function AuditLogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    
    if (user) {
      const init = async () => {
        const { doc, getDoc } = await import("firebase/firestore");
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().isAdmin) {
          setIsAdmin(true);
          fetchLogs();
        } else {
          router.push("/dashboard");
        }
      };
      init();
    }
  }, [user, authLoading, router]);

  const fetchLogs = async () => {
    try {
      const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, label: "Overview", id: "overview", onClick: () => router.push("/admin") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, label: "Users", id: "users", onClick: () => router.push("/admin/users") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: "Revenue", id: "revenue", onClick: () => router.push("/admin/revenue") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: "Audit Log", id: "audit-log", onClick: () => router.push("/admin/audit-log") },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: "Settings", id: "settings", onClick: () => router.push("/admin/settings") },
  ];

  if (authLoading || loading || !isAdmin) {
    return (
      <div className="flex min-h-screen bg-[#080b0f]">
        <Sidebar navItems={navItems} activeItem="audit-log" onNavChange={() => {}} variant="admin" />
        <main className="flex-1 lg:ml-[240px] p-6 pt-20 lg:pt-6">
          <div className="space-y-8 animate-pulse max-w-5xl">
            <div className="flex justify-between">
              <div>
                <div className="h-8 bg-cyber-card w-48 rounded mb-2 border border-cyber-border/50"></div>
                <div className="h-4 bg-cyber-card w-64 rounded border border-cyber-border/50"></div>
              </div>
              <div className="h-10 bg-cyber-card w-80 rounded border border-cyber-border/50"></div>
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="space-y-4">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="h-8 bg-cyber-bg border border-cyber-border w-32 rounded"></div>
                    <div className="h-8 bg-cyber-bg border border-cyber-border flex-1 rounded"></div>
                    <div className="h-8 bg-cyber-bg border border-cyber-border w-24 rounded"></div>
                    <div className="h-8 bg-cyber-bg border border-cyber-border flex-1 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) || log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "ALL" || log.action.includes(filterType);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getBadgeStyle = (action: string) => {
    if (action.includes("LOGIN") || action.includes("AUTH") || action.includes("OTP")) return "bg-blue-400/10 text-blue-400 border-blue-400/20";
    if (action.includes("REPORT") || action.includes("GENERATE")) return "bg-cyan-400/10 text-cyan-400 border-cyan-400/20";
    if (action.includes("PRO") || action.includes("BILLING")) return "bg-green-400/10 text-green-400 border-green-400/20";
    if (action.includes("SUSPEND") || action.includes("SECURITY")) return "bg-amber-400/10 text-amber-400 border-amber-400/20";
    return "bg-cyber-purple/10 text-cyber-purple border-cyber-purple/20";
  };

  const exportCSV = () => {
    const headers = ["Timestamp", "User/Admin", "Action", "Details"];
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + filteredLogs.map(e => `"${new Date(e.createdAt).toLocaleString()}","${e.adminEmail}","${e.action}","${e.details}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vulnai_audit_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-[#080b0f]">
      <Sidebar navItems={navItems} activeItem="audit-log" onNavChange={() => {}} variant="admin" />
      <main className="flex-1 lg:ml-[240px] p-6 pt-20 lg:pt-6 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8 max-w-5xl"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Audit Log</h1>
              <p className="text-sm text-cyber-muted">Centralized record of all sensitive platform actions.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text" placeholder="Search logs..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-cyber-bg border border-cyber-border rounded-lg px-4 py-2 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none flex-1 sm:w-48"
              />
              <select
                value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-sm text-cyber-text focus:border-cyber-cyan focus:outline-none appearance-none"
              >
                <option value="ALL">All Types</option>
                <option value="AUTH">Auth / Login</option>
                <option value="REPORT">Reports</option>
                <option value="PRO">Billing</option>
                <option value="SUSPEND">Security</option>
              </select>
              <button onClick={exportCSV} className="bg-cyber-cyan text-cyber-bg font-bold px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform flex-shrink-0 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-cyber-muted uppercase bg-cyber-card border-b border-cyber-border">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-cyber-border/30 hover:bg-cyber-border/10">
                      <td className="px-4 py-3 whitespace-nowrap text-cyber-muted font-mono text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-white text-xs">{log.adminEmail}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide font-bold ${getBadgeStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-cyber-muted">{log.details}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-cyber-muted">No audit logs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-cyber-border mt-2">
                <p className="text-xs text-cyber-muted">
                  Showing <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of <span className="font-bold text-white">{filteredLogs.length}</span> logs
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs border border-cyber-border rounded hover:bg-cyber-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-cyber-muted"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 text-xs border border-cyber-border rounded hover:bg-cyber-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-cyber-muted"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
