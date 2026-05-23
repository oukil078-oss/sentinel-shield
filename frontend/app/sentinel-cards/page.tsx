"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Zap, ArrowRight, Mail, Shield, Lock, Globe } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function SentinelCardsPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <div className="px-6 pb-10 flex items-center justify-center min-h-[calc(100vh-96px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg w-full text-center"
          >
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-accent-green/20 blur-[60px] rounded-full" />
              <div className="relative w-20 h-20 rounded-3xl bg-card border border-border-card shadow-elevated flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-accent-green" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-3">
              Sentinel-<span className="text-accent-green">Cards</span>
            </h1>
            <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto">
              AI-powered credit card fraud detection is coming soon. Real-time transaction monitoring, behavioral biometrics, and anomaly detection built for modern financial institutions.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { icon: <Zap className="w-4 h-4" />, label: "Real-time" },
                { icon: <Lock className="w-4 h-4" />, label: "PCI-DSS" },
                { icon: <Globe className="w-4 h-4" />, label: "Global" },
              ].map((f) => (
                <div key={f.label} className="bg-card rounded-xl p-4 border border-border-card shadow-card text-center">
                  <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center text-accent-green mx-auto mb-2">
                    {f.icon}
                  </div>
                  <p className="text-xs font-semibold text-text-primary">{f.label}</p>
                </div>
              ))}
            </div>

            {!submitted ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setSubmitted(true);
                }}
                className="flex items-center gap-2 max-w-sm mx-auto"
              >
                <div className="flex-1 flex items-center bg-card rounded-xl border border-border-card px-4 py-3 shadow-card">
                  <Mail className="w-4 h-4 text-text-muted mr-2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for early access"
                    className="bg-transparent text-sm text-white placeholder:text-muted outline-none w-full"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary flex items-center gap-2 shrink-0">
                  Notify Me <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-card p-5 border border-accent-green/20 shadow-glow max-w-sm mx-auto"
              >
                <Shield className="w-6 h-6 text-accent-green mx-auto mb-2" />
                <p className="text-sm font-semibold text-text-primary">You&apos;re on the list</p>
                <p className="text-xs text-text-secondary mt-1">We&apos;ll notify {email} when Sentinel-Cards launches.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
