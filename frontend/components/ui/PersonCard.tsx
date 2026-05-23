"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface PersonCardProps {
  name: string;
  role: string;
  org: string;
  avatar: string;
  sources: string[];
  interestLevel: number; // 1-5
  delay?: number;
}

export default function PersonCard({ name, role, org, avatar, sources, interestLevel, delay = 0 }: PersonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#1a1a1a] rounded-[24px] p-5 border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] hover:border-[rgba(255,255,255,0.08)] transition-all group cursor-pointer relative"
    >
      <div className="flex items-start justify-between mb-4">
        <img src={avatar} alt={name} className="w-[72px] h-[72px] rounded-full object-cover border-2 border-[rgba(255,255,255,0.06)]" />
        <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[rgba(255,255,255,0.06)] group-hover:bg-[#b5f023] group-hover:text-[#0f0f0f] transition-all">
          <ArrowUpRight className="w-4 h-4 text-[#9a9a9a] group-hover:text-[#0f0f0f]" />
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-0.5">{name}</h3>
      <p className="text-xs text-[#9a9a9a] mb-4">{role} at {org}</p>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-[#555555] uppercase tracking-wider font-semibold">Source</span>
        {sources.map((s) => (
          <span key={s} className="text-[10px] bg-[#2a2a2a] text-white px-2 py-0.5 rounded-[999px] border border-[rgba(255,255,255,0.06)]">
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${
              i <= interestLevel
                ? i <= 2
                  ? "bg-red-500"
                  : i === 3
                  ? "bg-amber-500"
                  : "bg-emerald-500"
                : "bg-[#2a2a2a]"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
