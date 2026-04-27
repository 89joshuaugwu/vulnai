"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { collection, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logAuditAction } from "@/lib/db";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface UserRecord {
  id: string;
  email: string;
  isPro: boolean;
  isAdmin: boolean;
  isSuspended?: boolean;
  reportsGeneratedTotal: number;
  lastLoginDate?: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    
    if (user) {
      const checkAdmin = async () => {
        const { getDoc } = await import("firebase/firestore");
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().isAdmin) {
          setIsAdmin(true);
          fetchUsers();
        } else {
          router.push("/dashboard");
        }
      };
      checkAdmin();
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRecord));
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    if (!confirm(`Are you sure you want to ${currentlySuspended ? 'unsuspend' : 'suspend'} this user?`)) return;
    try {
      await updateDoc(doc(db, "users", userId), { isSuspended: !currentlySuspended });
      if (user) await logAuditAction(user.uid, user.email || "Unknown", currentlySuspended ? "UNSUSPEND_USER" : "SUSPEND_USER", `Toggled suspend status for user ${userId}`);
      toast.success(`User ${currentlySuspended ? 'unsuspended' : 'suspended'}`);
      setUsers(users.map(u => u.id === userId ? { ...u, isSuspended: !currentlySuspended } : u));
    } catch (e) {
      toast.error("Failed to update user");
    }
    setOpenMenuId(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("WARNING: Are you absolutely sure you want to delete this user? This cannot be undone.")) return;
    // In a real app, this would call a Cloud Function to delete the auth user as well.
    // Here we'll just mock it or skip it, as it's complex to delete auth users from client.
    toast.error("User deletion requires Admin SDK (Cloud Function).");
    setOpenMenuId(null);
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
        <Sidebar navItems={navItems} activeItem="users" onNavChange={() => {}} variant="admin" />
        <main className="flex-1 lg:ml-[240px] p-6 pt-20 lg:pt-6">
          <div className="space-y-8 animate-pulse max-w-6xl">
            <div>
              <div className="h-8 bg-cyber-card w-48 rounded mb-2 border border-cyber-border/50"></div>
              <div className="h-4 bg-cyber-card w-64 rounded border border-cyber-border/50"></div>
            </div>
            <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
              <div className="h-10 bg-cyber-bg/50 border border-cyber-border w-full rounded mb-6"></div>
              <div className="space-y-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="h-8 bg-cyber-bg border border-cyber-border flex-1 rounded"></div>
                    <div className="h-8 bg-cyber-bg border border-cyber-border w-24 rounded"></div>
                    <div className="h-8 bg-cyber-bg border border-cyber-border w-24 rounded"></div>
                    <div className="h-8 bg-cyber-bg border border-cyber-border w-24 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Pagination Logic
  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes("")); // To be hooked up with search if needed
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex min-h-screen bg-[#080b0f]">
      <Sidebar navItems={navItems} activeItem="users" onNavChange={() => {}} variant="admin" />
      <main className="flex-1 lg:ml-[240px] p-6 pt-20 lg:pt-6 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
            <p className="text-sm text-cyber-muted">View and manage all registered users.</p>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
            <div className="table-responsive">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="text-xs text-cyber-muted uppercase bg-cyber-card border-b border-cyber-border">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 text-center">Reports Gen</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="border-b border-cyber-border/30 hover:bg-cyber-border/10">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        {u.isAdmin && <span className="bg-cyber-red/20 text-cyber-red text-[10px] px-1.5 py-0.5 rounded border border-cyber-red/30">ADMIN</span>}
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        {u.isPro ? (
                          <span className="bg-cyber-purple/20 text-cyber-purple text-[10px] px-2 py-0.5 rounded-full border border-cyber-purple/30">PRO</span>
                        ) : (
                          <span className="bg-cyber-muted/20 text-cyber-muted text-[10px] px-2 py-0.5 rounded-full border border-cyber-muted/30">FREE</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-cyber-cyan">{u.reportsGeneratedTotal || 0}</td>
                      <td className="px-4 py-3 text-xs text-cyber-muted">
                        {u.lastLoginDate ? new Date(u.lastLoginDate).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        {u.isSuspended ? (
                          <span className="text-cyber-red text-xs">Suspended</span>
                        ) : (
                          <span className="text-cyber-green text-xs">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        {!u.isAdmin && (
                          <>
                            <button 
                              onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                              className="text-cyber-muted hover:text-white p-1 rounded hover:bg-cyber-bg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            </button>
                            {openMenuId === u.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-cyber-card border border-cyber-border rounded-lg shadow-xl z-50 overflow-hidden">
                                <button onClick={() => { /* Upgrade Logic */ setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-xs text-cyber-text hover:bg-cyber-bg hover:text-cyber-cyan transition-colors">
                                  Upgrade Plan
                                </button>
                                <button onClick={() => { /* Email Logic */ setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-xs text-cyber-text hover:bg-cyber-bg hover:text-cyber-cyan transition-colors">
                                  Send Email
                                </button>
                                <button onClick={() => handleToggleSuspend(u.id, !!u.isSuspended)} className="w-full text-left px-4 py-2 text-xs text-cyber-orange hover:bg-cyber-bg transition-colors border-t border-cyber-border">
                                  {u.isSuspended ? "Unsuspend User" : "Suspend User"}
                                </button>
                                <button onClick={() => handleDeleteUser(u.id)} className="w-full text-left px-4 py-2 text-xs text-cyber-red hover:bg-cyber-bg transition-colors">
                                  Delete Account
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-cyber-border">
                <p className="text-xs text-cyber-muted">
                  Showing <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold text-white">{filteredUsers.length}</span> users
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
