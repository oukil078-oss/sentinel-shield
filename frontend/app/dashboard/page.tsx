"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import {
  Shield, Zap, ArrowUpRight, Inbox, ScanLine,
  Brain, ChevronRight, FileText, Download
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MetricCard from "@/components/ui/MetricCard";
import PersonCard from "@/components/ui/PersonCard";
import TaskCard from "@/components/ui/TaskCard";
import DocumentCard from "@/components/ui/DocumentCard";
import GoalCard from "@/components/ui/GoalCard";
import PillTag from "@/components/ui/PillTag";
import { apiFetch, formatDate, labelBadgeClass } from "@/lib/utils";

const severityColors: Record<string, string> = {
  phishing: "#ef4444",
  suspicious: "#f59e0b",
  safe: "#22c55e",
  spam: "#8b5cf6",
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>({});
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/analytics/dashboard-kpis").then(setKpis).catch(() => {}),
      apiFetch("/analytics/detections-over-time?days=14").then(setTimeSeries).catch(() => {}),
      apiFetch("/analytics/classification-distribution?days=30").then(setDistribution).catch(() => {}),
      apiFetch("/detections/?limit=6").then(setRecent).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />

        <div className="px-6 pb-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Sentinel-Shield Overview</h1>
              <p className="text-sm text-[#9a9a9a] mt-1">Real-time threat intelligence and SOC operations dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <PillTag label="All" />
              <PillTag label="Hot" active />
              <PillTag label="Due Today" />
            </div>
          </motion.div>

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard label="Total Detections" value={kpis.total_detections ?? 0} trend={12} delay={0} />
            <MetricCard label="Phishing Rate" value={kpis.phishing_rate ?? 0} suffix="%" trend={-3.2} delay={0.05} />
            <MetricCard label="Suspicious Rate" value={kpis.suspicious_rate ?? 0} suffix="%" trend={5.1} delay={0.1} />
            <MetricCard label="Pending Queue" value={kpis.pending_queue ?? 0} trend={-8} delay={0.15} />
            <MetricCard label="Model Accuracy" value={kpis.model_accuracy ?? 97.3} suffix="%" trend={0.8} delay={0.2} />
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Main Chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-[#1a1a1a] rounded-[24px] p-6 border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white">Detection Volume</h3>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-[#9a9a9a]">
                    <span className="w-2 h-2 rounded-full bg-[#b5f023]" /> Phishing
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[#9a9a9a]">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Suspicious
                  </span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="colorPhish" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b5f023" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#b5f023" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSusp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "#555555", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#555555", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area type="monotone" dataKey="phishing" stroke="#b5f023" strokeWidth={2} fill="url(#colorPhish)" />
                    <Area type="monotone" dataKey="suspicious" stroke="#f59e0b" strokeWidth={2} fill="url(#colorSusp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Distribution Donut */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#1a1a1a] rounded-[24px] p-6 border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Classification Distribution</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="label"
                    >
                      {distribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={severityColors[entry.label] || "#9a9a9a"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "14px",
                        fontSize: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {distribution.map((d: any) => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-[#9a9a9a]">
                      <span className="w-2 h-2 rounded-full" style={{ background: severityColors[d.label] || "#9a9a9a" }} />
                      {d.label}
                    </span>
                    <span className="text-white font-semibold">{d.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Person Cards + Tasks Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <PersonCard
              name="Jane Doe"
              role="Marketing Director"
              org="Microsoft"
              avatar="https://i.pravatar.cc/150?u=jane"
              sources={["LinkedIn", "Email"]}
              interestLevel={4}
              delay={0.3}
            />
            <PersonCard
              name="Wade Warren"
              role="Operations Manager"
              org="Zenith"
              avatar="https://i.pravatar.cc/150?u=wade"
              sources={["Typeform"]}
              interestLevel={3}
              delay={0.35}
            />
            <PersonCard
              name="Darlene Robertson"
              role="Senior Analyst"
              org="Acme Corp"
              avatar="https://i.pravatar.cc/150?u=darlene"
              sources={["LinkedIn", "Email", "Web"]}
              interestLevel={5}
              delay={0.4}
            />
          </div>

          {/* Task Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <TaskCard
              title="Google Meet Call"
              subtitle="Security review sync — 2pm"
              date="Today"
              status="scheduled"
              assignees={["https://i.pravatar.cc/150?u=a1", "https://i.pravatar.cc/150?u=a2"]}
              highlighted
              delay={0.1}
            />
            <TaskCard
              title="Send Proposal"
              subtitle="Enterprise phishing audit"
              date="Tomorrow"
              status="in_progress"
              assignees={["https://i.pravatar.cc/150?u=a3"]}
              delay={0.15}
            />
            <TaskCard
              title="Model Retraining"
              subtitle="Weekly pipeline update"
              date="May 24"
              status="pending"
              assignees={["https://i.pravatar.cc/150?u=a4", "https://i.pravatar.cc/150?u=a5"]}
              delay={0.2}
            />
            <TaskCard
              title="Quarterly Review"
              subtitle="SOC performance metrics"
              date="May 28"
              status="completed"
              assignees={["https://i.pravatar.cc/150?u=a6"]}
              delay={0.25}
            />
          </div>

          {/* Documents + Goals + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <DocumentCard label="Brief" count={4} delay={0.3} />

            <GoalCard
              title="Goal"
              delay={0.35}
              content={
                <>
                  Reduce the number of security <span className="text-[#b5f023] font-semibold">incidents by 50%</span>. The goal is{" "}
                  <span className="text-[#b5f023] font-semibold">quantitative and measurable</span> and it would have a significant impact on the
                  organization&apos;s security posture.
                </>
              }
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#1a1a1a] rounded-[24px] p-5 border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Recent Detections</h3>
                <a href="/detection" className="text-xs text-[#b5f023] hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="space-y-3">
                {recent.map((r: any, i: number) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-[16px] bg-[#1e1e1e]/60 border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-colors cursor-pointer group"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${r.label === "phishing" ? "bg-red-500" : r.label === "suspicious" ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate group-hover:text-[#b5f023] transition-colors">{r.subject || "Untitled"}</p>
                      <p className="text-[10px] text-[#555555] truncate">{r.sender || "Unknown sender"}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${labelBadgeClass(r.label)}`}>
                      {r.label}
                    </span>
                  </motion.div>
                ))}
                {recent.length === 0 && (
                  <div className="text-center py-8 text-[#555555] text-sm">No recent detections found</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Model Health + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-[#1a1a1a] rounded-[24px] p-6 border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-white">Model Health</h3>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Healthy
                </span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Accuracy", value: 97.3 },
                  { label: "Precision", value: 97.1 },
                  { label: "Recall", value: 96.7 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#9a9a9a]">{m.label}</span>
                      <span className="text-white font-semibold">{m.value}%</span>
                    </div>
                    <div className="h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.value}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-[#b5f023] rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-[#1a1a1a] rounded-[24px] p-6 border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a href="/detection" className="flex items-center gap-3 p-4 rounded-[16px] bg-[#1e1e1e]/60 border border-[rgba(255,255,255,0.04)] hover:border-[#b5f023]/30 hover:shadow-[0_0_20px_rgba(181,240,35,0.05)] transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#b5f023]/10 flex items-center justify-center text-[#b5f023] group-hover:scale-110 transition-transform">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#b5f023] transition-colors">New Detection</p>
                    <p className="text-[11px] text-[#555555]">Analyze email or SMS</p>
                  </div>
                </a>
                <a href="/cases" className="flex items-center gap-3 p-4 rounded-[16px] bg-[#1e1e1e]/60 border border-[rgba(255,255,255,0.04)] hover:border-[#b5f023]/30 hover:shadow-[0_0_20px_rgba(181,240,35,0.05)] transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#b5f023]/10 flex items-center justify-center text-[#b5f023] group-hover:scale-110 transition-transform">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#b5f023] transition-colors">Analyst Queue</p>
                    <p className="text-[11px] text-[#555555]">{kpis.pending_queue ?? 0} pending cases</p>
                  </div>
                </a>
                <a href="/chat" className="flex items-center gap-3 p-4 rounded-[16px] bg-[#1e1e1e]/60 border border-[rgba(255,255,255,0.04)] hover:border-[#b5f023]/30 hover:shadow-[0_0_20px_rgba(181,240,35,0.05)] transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#b5f023]/10 flex items-center justify-center text-[#b5f023] group-hover:scale-110 transition-transform">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-[#b5f023] transition-colors">AI Assistant</p>
                    <p className="text-[11px] text-[#555555]">Ask about threats</p>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
