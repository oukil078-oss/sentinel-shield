"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Brain, Sparkles, User, ChevronRight, Shield } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiFetch } from "@/lib/utils";

export default function ChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch("/chat/sessions").then((data: any[]) => {
      setSessions(data);
      if (data.length > 0) {
        setActiveSession(data[0].id);
        loadMessages(data[0].id);
      }
    });
  }, []);

  async function loadMessages(sessionId: string) {
    const data = await apiFetch(`/chat/sessions/${sessionId}/messages`);
    setMessages(data);
  }

  async function createSession() {
    const s = await apiFetch("/chat/sessions", { method: "POST" });
    setSessions((prev) => [s, ...prev]);
    setActiveSession(s.id);
    setMessages([]);
  }

  async function sendMessage() {
    if (!input.trim() || !activeSession) return;
    const text = input;
    setInput("");
    setLoading(true);
    try {
      const msg = await apiFetch(`/chat/sessions/${activeSession}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: text, context: { page: "chat" } }),
      });
      const updated = await apiFetch(`/chat/sessions/${activeSession}/messages`);
      setMessages(updated);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <div className="flex-1 px-6 pb-6 flex gap-5 h-[calc(100vh-96px)]">
          {/* Sidebar sessions */}
          <div className="w-64 bg-card rounded-card border border-border-card shadow-card p-4 flex flex-col hidden xl:flex">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Conversations</h3>
              <button onClick={createSession} className="w-7 h-7 rounded-lg bg-accent-green/10 text-accent-green flex items-center justify-center hover:bg-accent-green/20 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1 flex-1 overflow-y-auto">
              {sessions.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSession(s.id); loadMessages(s.id); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                    activeSession === s.id ? "bg-accent-green/10 text-accent-green" : "text-text-secondary hover:bg-white/[0.03] hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{s.title || "New Chat"}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 bg-card rounded-card border border-border-card shadow-card flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Sentinel AI Assistant</p>
                <p className="text-[11px] text-text-muted">Senior Phishing Analyst + AI Engineer</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#1e1e1e] border border-border-subtle flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-accent-green" />
                  </div>
                  <p className="text-sm text-text-primary font-medium mb-1">How can I help today?</p>
                  <p className="text-xs text-text-muted max-w-sm">
                    Ask me about phishing detections, case summaries, model metrics, or threat intelligence insights.
                  </p>
                </div>
              )}
              {messages.map((m: any) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green shrink-0 mt-0.5">
                      <Brain className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-accent-green text-black font-medium"
                      : "bg-[#1e1e1e] text-text-primary border border-border-subtle"
                  }`}>
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-text-muted" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green shrink-0">
                    <Brain className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="bg-[#1e1e1e] border border-border-subtle rounded-2xl px-4 py-2.5 text-sm text-text-muted">
                    Analyzing threat context...
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border-subtle">
              <div className="flex items-center gap-3 bg-[#1e1e1e] rounded-xl border border-border-subtle px-4 py-2.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask about detections, cases, models..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-muted outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-lg bg-accent-green text-black flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
