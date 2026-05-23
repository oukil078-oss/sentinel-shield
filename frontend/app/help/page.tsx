"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, BookOpen, MessageSquare, FileText, ArrowRight, ExternalLink } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const resources = [
  {
    title: "Getting Started",
    description: "Learn the basics of Sentinel-Shield, navigation, and your first threat detection.",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    title: "Detection Guide",
    description: "How to use the Detection Workspace, interpret results, and manage false positives.",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: "Analyst Playbook",
    description: "Triage workflows, escalation procedures, and case management best practices.",
    icon: <HelpCircle className="w-5 h-5" />,
  },
  {
    title: "AI Assistant",
    description: "Tips for using the Sentinel AI Assistant to explain detections and summarize cases.",
    icon: <MessageSquare className="w-5 h-5" />,
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <div className="px-6 pb-10 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Help Center</h1>
            <p className="text-sm text-text-secondary mt-1">Documentation, guides, and support resources</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {resources.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-card rounded-card p-6 border border-border-card shadow-card hover:border-accent-green/20 hover:shadow-elevated transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center text-accent-green mb-4 group-hover:scale-110 transition-transform">
                  {r.icon}
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1 group-hover:text-accent-green transition-colors">{r.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">{r.description}</p>
                <div className="flex items-center gap-1 text-xs text-accent-green font-medium">
                  Read more <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-6 bg-card rounded-card p-6 border border-border-card shadow-card text-center"
          >
            <p className="text-sm text-text-primary font-medium mb-1">Need direct support?</p>
            <p className="text-xs text-text-secondary mb-4">Our team is available for enterprise customers and critical security incidents.</p>
            <a href="mailto:zakaryaoukil2003@gmail.com" className="inline-flex items-center gap-2 text-xs text-accent-green hover:underline">
              Contact Zakarya Oukil <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
