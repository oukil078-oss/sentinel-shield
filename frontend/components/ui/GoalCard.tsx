"use client";

import React from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

interface GoalCardProps {
  title: string;
  content: React.ReactNode;
  delay?: number;
}

export default function GoalCard({ title, content, delay = 0 }: GoalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#1a1a1a] rounded-[24px] p-5 border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center border border-[rgba(255,255,255,0.06)] text-[#9a9a9a] hover:text-white hover:bg-[#333] transition-all opacity-0 group-hover:opacity-100">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="text-sm text-[#9a9a9a] leading-relaxed">{content}</div>
    </motion.div>
  );
}
