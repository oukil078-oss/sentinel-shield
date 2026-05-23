"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, RotateCcw, Download, ArrowUpRight, Activity } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiFetch } from "@/lib/utils";

export default function ModelsPage() {
  const [versions, setVersions] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/models/versions").then(setVersions),
      apiFetch("/models/training-jobs").then(setJobs),
      apiFetch("/models/active").then(setActive).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function deploy(id: string) {
    await apiFetch(`/models/versions/${id}/deploy`, { method: "POST" });
    const updated = await apiFetch("/models/versions");
    setVersions(updated);
    const a = await apiFetch("/models/active").catch(() => null);
    if (a) setActive(a);
  }

  async function retrain() {
    await apiFetch("/models/retrain", { method: "POST" });
    const j = await apiFetch("/models/training-jobs");
    setJobs(j);
  }

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <div className="px-6 pb-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Model Management</h1>
            <p className="text-sm text-text-secondary mt-1">Active models, version history, and training jobs</p>
          </motion.div>

          {/* Active Model Card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-card p-6 border border-border-card shadow-card mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">{active?.version || "No Active Model"}</h2>
                  <p className="text-xs text-text-muted">{active?.algorithm || "TF-IDF + Logistic Regression"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Deployed
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-border-subtle text-center">
                <p className="text-2xl font-bold text-text-primary">{active ? (active.accuracy * 100).toFixed(1) : "—"}%</p>
                <p className="text-[11px] text-text-muted mt-1">Accuracy</p>
              </div>
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-border-subtle text-center">
                <p className="text-2xl font-bold text-text-primary">{active ? (active.precision * 100).toFixed(1) : "—"}%</p>
                <p className="text-[11px] text-text-muted mt-1">Precision</p>
              </div>
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-border-subtle text-center">
                <p className="text-2xl font-bold text-text-primary">{active ? (active.recall * 100).toFixed(1) : "—"}%</p>
                <p className="text-[11px] text-text-muted mt-1">Recall</p>
              </div>
              <div className="bg-[#1e1e1e] rounded-xl p-4 border border-border-subtle text-center">
                <p className="text-2xl font-bold text-text-primary">{active ? (active.f1_score * 100).toFixed(1) : "—"}%</p>
                <p className="text-[11px] text-text-muted mt-1">F1 Score</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={retrain} className="btn-primary text-xs flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" /> Retrain Model
              </button>
              <button className="btn-secondary text-xs flex items-center gap-2">
                <Download className="w-3.5 h-3.5" /> Export Artifacts
              </button>
            </div>
          </motion.div>

          {/* Version History */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-card p-6 border border-border-card shadow-card mb-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Version History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-xs text-text-muted uppercase tracking-wider">
                    <th className="pb-3 font-medium">Version</th>
                    <th className="pb-3 font-medium">Algorithm</th>
                    <th className="pb-3 font-medium">Accuracy</th>
                    <th className="pb-3 font-medium">F1</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {versions.map((v: any) => (
                    <tr key={v.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 font-semibold text-text-primary">{v.version}</td>
                      <td className="py-3.5 text-text-secondary">{v.algorithm}</td>
                      <td className="py-3.5 text-text-primary">{v.accuracy ? (v.accuracy * 100).toFixed(1) + "%" : "—"}</td>
                      <td className="py-3.5 text-text-primary">{v.f1_score ? (v.f1_score * 100).toFixed(1) + "%" : "—"}</td>
                      <td className="py-3.5">
                        {v.is_active ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Active</span>
                        ) : (
                          <span className="text-[10px] font-bold text-text-muted bg-[#2a2a2a] px-2 py-1 rounded-full border border-border-subtle">Inactive</span>
                        )}
                      </td>
                      <td className="py-3.5 text-xs text-text-muted">{new Date(v.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 text-right">
                        {!v.is_active && (
                          <button onClick={() => deploy(v.id)} className="text-xs text-accent-green hover:underline flex items-center gap-1 ml-auto">
                            Deploy <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Training Jobs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-card p-6 border border-border-card shadow-card">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Training Jobs</h3>
            <div className="space-y-3">
              {jobs.map((j: any) => (
                <div key={j.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1e1e1e]/60 border border-border-subtle">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-accent-green" />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{j.algorithm}</p>
                      <p className="text-[11px] text-text-muted">{j.status} • {j.dataset_rows ?? "—"} rows</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${
                    j.status === "completed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                    j.status === "running" ? "text-accent-green bg-accent-green/10 border-accent-green/20" :
                    j.status === "failed" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                    "text-text-muted bg-[#2a2a2a] border-border-subtle"
                  }`}>
                    {j.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
