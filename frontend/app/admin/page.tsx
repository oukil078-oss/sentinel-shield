"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Shield, KeyRound, Activity } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiFetch } from "@/lib/utils";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/admin/users").then(setUsers),
      apiFetch("/admin/audit-logs").then(setLogs),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <div className="px-6 pb-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Admin Panel</h1>
            <p className="text-sm text-text-secondary mt-1">User management, audit logs, and system settings</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* User Management */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-card p-5 border border-border-card shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent-green" /> Users
                </h3>
                <span className="text-[10px] bg-accent-green/10 text-accent-green px-2 py-1 rounded-full border border-accent-green/20 font-bold">
                  {users.length} total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-xs text-text-muted uppercase tracking-wider">
                      <th className="pb-3 font-medium text-left">User</th>
                      <th className="pb-3 font-medium text-left">Role</th>
                      <th className="pb-3 font-medium text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <img src={u.avatar_url || `https://i.pravatar.cc/150?u=${u.id}`} alt="" className="w-8 h-8 rounded-full border border-border-subtle object-cover" />
                            <div>
                              <p className="text-xs font-semibold text-text-primary">{u.first_name} {u.last_name}</p>
                              <p className="text-[11px] text-text-muted">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full border bg-[#2a2a2a] text-white border-border-subtle uppercase">
                            {u.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${
                            u.is_active ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
                          }`}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Audit Log */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-card p-5 border border-border-card shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-accent-green" /> Audit Log
                </h3>
                <span className="text-[10px] bg-accent-green/10 text-accent-green px-2 py-1 rounded-full border border-accent-green/20 font-bold">
                  {logs.length} events
                </span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {logs.map((l: any) => (
                  <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#1e1e1e]/60 border border-border-subtle">
                    <Activity className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-text-primary font-medium">{l.action}</p>
                      <p className="text-[11px] text-text-muted">{l.entity_type} • {new Date(l.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
