"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, Search, Filter, ChevronDown, ArrowUpDown, MoreHorizontal,
  AlertTriangle, Shield, AlertCircle, CheckCircle2, Clock, XCircle,
  MessageSquare, User
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiFetch, formatDate, labelBadgeClass } from "@/lib/utils";

const statuses = ["all", "open", "in_progress", "resolved", "escalated", "closed"];
const priorities = ["all", "low", "medium", "high", "critical"];

function priorityColor(p: string) {
  switch (p) {
    case "critical": return "bg-red-500";
    case "high": return "bg-amber-500";
    case "medium": return "bg-blue-500";
    default: return "bg-emerald-500";
  }
}

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);

  useEffect(() => {
    apiFetch("/cases/").then(setCases).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = cases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.detection?.sender?.toLowerCase().includes(q) ||
        c.detection?.subject?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <div className="px-6 pb-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Analyst Queue</h1>
            <p className="text-sm text-text-secondary mt-1">Manage, triage, and resolve threat cases</p>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center bg-card rounded-xl px-3 py-2 border border-border-card shadow-card flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-text-muted mr-2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by sender, subject..."
                className="bg-transparent text-sm text-white placeholder:text-muted outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border border-border-card rounded-xl text-xs text-text-primary px-3 py-2 outline-none focus:border-accent-green"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace("_", " ")}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-card border border-border-card rounded-xl text-xs text-text-primary px-3 py-2 outline-none focus:border-accent-green"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>{p === "all" ? "All Priorities" : p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Case Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-card p-5 border border-border-card h-40 skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedCase(c)}
                  className="bg-card rounded-card p-5 border border-border-card shadow-card hover:border-accent-green/20 hover:shadow-elevated transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${priorityColor(c.priority)}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{c.priority}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${labelBadgeClass(c.detection?.label)}`}>
                      {c.detection?.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-accent-green transition-colors truncate">
                    {c.title}
                  </h3>
                  <p className="text-xs text-text-muted truncate mb-4">{c.detection?.sender || "No sender"}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {c.assignee ? (
                        <img src={c.assignee.avatar_url || `https://i.pravatar.cc/150?u=${c.assignee.id}`} alt="" className="w-6 h-6 rounded-full border border-border-subtle object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-border-subtle">
                          <User className="w-3 h-3 text-text-muted" />
                        </div>
                      )}
                      <span className="text-[11px] text-text-muted">{c.assignee ? `${c.assignee.first_name} ${c.assignee.last_name}` : "Unassigned"}</span>
                    </div>
                    <span className="text-[11px] text-text-muted">{formatDate(c.created_at)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <Inbox className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No cases match your filters</p>
            </div>
          )}
        </div>
      </main>

      {/* Case Detail Drawer */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedCase(null)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-sidebar border-l border-border-subtle h-full overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Case Detail</h2>
                <button onClick={() => setSelectedCase(null)} className="w-8 h-8 rounded-lg bg-card border border-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${priorityColor(selectedCase.priority)}`} />
                  <span className="text-sm font-semibold text-text-primary capitalize">{selectedCase.priority} Priority</span>
                  <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${labelBadgeClass(selectedCase.detection?.label)}`}>
                    {selectedCase.detection?.label}
                  </span>
                </div>

                <div className="bg-card rounded-card p-4 border border-border-card">
                  <p className="text-xs text-text-muted mb-1">Detection</p>
                  <p className="text-sm text-text-primary font-medium mb-1">{selectedCase.title}</p>
                  <p className="text-xs text-text-secondary">{selectedCase.detection?.sender || "No sender"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-card p-4 border border-border-card text-center">
                    <p className="text-2xl font-bold text-text-primary">{selectedCase.detection?.risk_score}</p>
                    <p className="text-[11px] text-text-muted">Risk Score</p>
                  </div>
                  <div className="bg-card rounded-card p-4 border border-border-card text-center">
                    <p className="text-2xl font-bold text-text-primary">{(selectedCase.detection?.confidence * 100).toFixed(0)}%</p>
                    <p className="text-[11px] text-text-muted">Confidence</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {["phishing", "suspicious", "spam", "safe", "false_positive"].map((s) => (
                      <button key={s} className="text-xs bg-[#2a2a2a] text-white rounded-pill px-3 py-1.5 border border-border-subtle hover:bg-[#333] transition-colors capitalize">
                        Mark {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">Activity Timeline</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-xs">
                      <Clock className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                      <div>
                        <p className="text-text-primary">Case created</p>
                        <p className="text-text-muted">{formatDate(selectedCase.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-xs">
                      <Shield className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                      <div>
                        <p className="text-text-primary">Detection analyzed</p>
                        <p className="text-text-muted">{formatDate(selectedCase.detection?.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
