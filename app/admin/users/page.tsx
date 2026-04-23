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
        <main className="flex-1 lg:ml-[240px] p-6 pt-20 lg:pt-6 flex items-center justify-center">
          <div className="animate-pulse text-cyber-muted">Loading users...</div>
        </main>
      </div>
    );
  }

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-cyber-muted uppercase bg-cyber-card border-b border-cyber-border">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 text-center">Reports Gen</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
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
                      <td className="px-4 py-3">
                        {u.isSuspended ? (
                          <span className="text-cyber-red text-xs">Suspended</span>
                        ) : (
                          <span className="text-cyber-green text-xs">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!u.isAdmin && (
                          <button
                            onClick={() => handleToggleSuspend(u.id, !!u.isSuspended)}
                            className={`text-xs px-3 py-1 rounded border transition-all ${
                              u.isSuspended 
                                ? "text-cyber-green border-cyber-green hover:bg-cyber-green/10" 
                                : "text-cyber-red border-cyber-red hover:bg-cyber-red/10"
                            }`}
                          >
                            {u.isSuspended ? "Unsuspend" : "Suspend"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
