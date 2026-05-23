"use client";

import React from "react";
import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";

interface DocumentCardProps {
  label: string;
  count: number;
  delay?: number;
}

export default function DocumentCard({ label, count, delay = 0 }: DocumentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#1a1a1a] rounded-[24px] p-5 border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Documents</h3>
        <button className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[rgba(255,255,255,0.06)] text-[#9a9a9a] hover:text-white hover:bg-[#333] transition-all">
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <div key={i} className="bg-[#1e1e1e] rounded-[16px] p-3 border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-all cursor-pointer">
            <div className="w-full aspect-[3/4] bg-[#252525] rounded-[12px] mb-2 flex items-center justify-center border border-[rgba(255,255,255,0.04)]">
              <FileText className="w-6 h-6 text-[#555555]" />
            </div>
            <p className="text-[10px] text-[#9a9a9a] truncate">{label} {i + 1}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
