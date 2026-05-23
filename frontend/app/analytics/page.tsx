"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, Legend
} from "recharts";
import { BarChart3, Calendar } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiFetch } from "@/lib/utils";

const COLORS = {
  phishing: "#ef4444",
  suspicious: "#f59e0b",
  safe: "#22c55e",
  spam: "#8b5cf6",
  info: "#3b82f6",
};

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [topDomains, setTopDomains] = useState<any[]>([]);
  const [topKeywords, setTopKeywords] = useState<any[]>([]);
  const [riskDist, setRiskDist] = useState<any[]>([]);

  useEffect(() => {
    apiFetch(`/analytics/detections-over-time?days=${days}`).then(setTimeSeries);
    apiFetch(`/analytics/classification-distribution?days=${days}`).then(setDistribution);
    apiFetch("/analytics/top-domains").then(setTopDomains);
    apiFetch("/analytics/top-keywords").then(setTopKeywords);
    apiFetch("/analytics/risk-score-distribution").then(setRiskDist);
  }, [days]);

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <div className="px-6 pb-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Analytics</h1>
              <p className="text-sm text-text-secondary mt-1">Threat intelligence metrics and trends</p>
            </div>
            <div className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 border border-border-card">
              <Calendar className="w-4 h-4 text-text-muted" />
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-transparent text-xs text-text-primary outline-none"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            {/* Time Series */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-card p-5 border border-border-card shadow-card">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Detections Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="cPhish" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#b5f023" stopOpacity={0.2}/><stop offset="95%" stopColor="#b5f023" stopOpacity={0}/></linearGradient>
                      <linearGradient id="cSusp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{fontSize:11}} />
                    <YAxis tick={{fontSize:11}} />
                    <Tooltip contentStyle={{background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", fontSize:"12px"}} />
                    <Area type="monotone" dataKey="phishing" stroke="#b5f023" strokeWidth={2} fill="url(#cPhish)" />
                    <Area type="monotone" dataKey="suspicious" stroke="#f59e0b" strokeWidth={2} fill="url(#cSusp)" />
                    <Area type="monotone" dataKey="safe" stroke="#22c55e" strokeWidth={2} fill="rgba(34,197,94,0.05)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Distribution */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-card p-5 border border-border-card shadow-card">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Classification Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="count" nameKey="label">
                      {distribution.map((entry: any, index: number) => (
                        <Cell key={index} fill={COLORS[entry.label as keyof typeof COLORS] || "#9a9a9a"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", fontSize:"12px"}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top Domains */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-card p-5 border border-border-card shadow-card">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Top Flagged Domains</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDomains} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" tick={{fontSize:11}} />
                    <YAxis dataKey="domain" type="category" width={140} tick={{fontSize:11}} />
                    <Tooltip contentStyle={{background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", fontSize:"12px"}} />
                    <Bar dataKey="count" fill="#b5f023" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top Keywords */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-card p-5 border border-border-card shadow-card">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Top Suspicious Keywords</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topKeywords}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="keyword" tick={{fontSize:11}} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{fontSize:11}} />
                    <Tooltip contentStyle={{background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", fontSize:"12px"}} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Risk Score Distribution */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-card p-5 border border-border-card shadow-card">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Risk Score Distribution</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="range" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} />
                  <Tooltip contentStyle={{background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", fontSize:"12px"}} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
