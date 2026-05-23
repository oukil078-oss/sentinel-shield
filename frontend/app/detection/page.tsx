"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Upload, FileText, Link2, AlertTriangle, ShieldCheck, Sparkles, Save, ArrowRight, Loader2, MessageSquare } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiFetch, labelBadgeClass } from "@/lib/utils";

export default function DetectionPage() {
  const [tab, setTab] = useState<"email" | "sms">("email");
  const [content, setContent] = useState("");
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function analyze() {
    setError("");
    if (!content.trim()) return;
    setLoading(true);
    try {
      const data = await apiFetch("/detections/analyze", {
        method: "POST",
        body: JSON.stringify({ content, content_type: tab, sender, subject }),
      });
      setResult(data.result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <div className="px-6 pb-10 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Detection Workspace</h1>
            <p className="text-sm text-text-secondary mt-1">Analyze emails and messages for phishing threats</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-5">
            {/* Input Panel */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-card rounded-card p-5 border border-border-card shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setTab("email")} className={`pill ${tab === "email" ? "pill-active" : ""}`}>
                    <FileText className="w-3.5 h-3.5 inline mr-1" /> Email
                  </button>
                  <button onClick={() => setTab("sms")} className={`pill ${tab === "sms" ? "pill-active" : ""}`}>
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1" /> SMS
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="Sender (e.g. name@domain.com)"
                      className="input-field text-sm"
                    />
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject line"
                      className="input-field text-sm"
                    />
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste raw message content, headers, and body here..."
                    className="w-full bg-input border border-border-subtle rounded-input p-4 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent-green transition-all min-h-[220px] resize-y"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload .txt or .eml</span>
                      <input type="file" className="hidden" accept=".txt,.eml" />
                    </label>
                    <button
                      onClick={analyze}
                      disabled={loading || !content.trim()}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                      Analyze
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-card p-4 text-sm text-red-400">
                  {error}
                </motion.div>
              )}
            </div>

            {/* Result Panel */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="bg-card rounded-card p-5 border border-border-card shadow-card space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${labelBadgeClass(result.label)}`}>
                        {result.label}
                      </span>
                      <span className="text-xs text-text-muted">{new Date(result.created_at).toLocaleString()}</span>
                    </div>

                    <div className="text-center py-2">
                      <div className="text-4xl font-bold text-text-primary">{result.risk_score}<span className="text-lg text-text-muted">/100</span></div>
                      <p className="text-xs text-text-secondary mt-1">Composite Risk Score</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-1.5">Model Confidence</p>
                        <div className="h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.confidence * 100}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${result.confidence > 0.85 ? "bg-accent-green" : result.confidence > 0.6 ? "bg-amber-500" : "bg-emerald-500"}`}
                          />
                        </div>
                        <p className="text-right text-xs text-text-muted mt-1">{(result.confidence * 100).toFixed(1)}%</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-1.5">Explanations</p>
                        <div className="space-y-1.5">
                          {result.explanations.map((ex: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-text-primary bg-[#1e1e1e]/60 rounded-lg p-2.5 border border-border-subtle">
                              <Sparkles className="w-3.5 h-3.5 text-accent-green shrink-0 mt-0.5" />
                              {ex}
                            </div>
                          ))}
                        </div>
                      </div>

                      {result.extracted_urls.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-text-secondary mb-1.5">Extracted URLs</p>
                          <div className="space-y-1.5">
                            {result.extracted_urls.map((url: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-text-primary bg-[#1e1e1e]/60 rounded-lg p-2 border border-border-subtle">
                                <Link2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                                <span className="truncate">{url}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold text-text-secondary mb-1.5">Recommended Actions</p>
                        <div className="flex flex-wrap gap-2">
                          {result.recommended_actions.map((a: string, i: number) => (
                            <span key={i} className="text-[11px] bg-accent-green/10 text-accent-green border border-accent-green/20 rounded-pill px-2.5 py-1">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button className="flex-1 btn-secondary text-xs flex items-center justify-center gap-1.5">
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button className="flex-1 btn-primary text-xs flex items-center justify-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5" /> Open as Case
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card rounded-card p-8 border border-border-card shadow-card text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] flex items-center justify-center mx-auto mb-4 border border-border-subtle">
                      <ShieldCheck className="w-6 h-6 text-text-muted" />
                    </div>
                    <p className="text-sm text-text-primary font-medium mb-1">Ready to Analyze</p>
                    <p className="text-xs text-text-secondary">Paste content and click Analyze to see AI-powered threat assessment</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
