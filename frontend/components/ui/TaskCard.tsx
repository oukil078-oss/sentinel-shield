"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  title: string;
  subtitle: string;
  date: string;
  status: "completed" | "in_progress" | "pending" | "scheduled";
  assignees: string[];
  highlighted?: boolean;
  delay?: number;
}

const statusConfig = {
  completed: { dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Completed" },
  in_progress: { dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-400", label: "In Progress" },
  pending: { dot: "bg-red-500", bg: "bg-red-500/10", text: "text-red-400", label: "Pending" },
  scheduled: { dot: "bg-[#b5f023]", bg: "bg-[#b5f023]/10", text: "text-[#b5f023]", label: "Scheduled" },
};

export default function TaskCard({ title, subtitle, date, status, assignees, highlighted = false, delay = 0 }: TaskCardProps) {
  const cfg = statusConfig[status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "rounded-[24px] p-5 border transition-all cursor-pointer group",
        highlighted
          ? "bg-[#b5f023]/10 border-[#b5f023]/20 shadow-[0_0_20px_rgba(181,240,35,0.08)]"
          : "bg-[#1a1a1a] border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] hover:border-[rgba(255,255,255,0.08)]"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", cfg.text)}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1 text-[#555555]">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="text-[10px]">2</span>
        </div>
      </div>

      <h3 className={cn("text-sm font-semibold mb-1", highlighted ? "text-[#b5f023]" : "text-white group-hover:text-[#b5f023] transition-colors")}>
        {title}
      </h3>
      <p className="text-xs text-[#555555] mb-4">{subtitle}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {assignees.map((a, i) => (
            <img key={i} src={a} alt="" className="w-6 h-6 rounded-full border border-[rgba(255,255,255,0.06)] object-cover" />
          ))}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#555555]">
          <Calendar className="w-3 h-3" />
          {date}
        </div>
      </div>
    </motion.div>
  );
}
