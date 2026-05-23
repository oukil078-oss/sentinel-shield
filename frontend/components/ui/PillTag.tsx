"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PillTagProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export default function PillTag({ label, active = false, onClick, icon }: PillTagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[999px] px-4 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "bg-[#b5f023] text-[#0f0f0f]"
          : "bg-[#2a2a2a] text-white border border-[rgba(255,255,255,0.06)] hover:bg-[#333333]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
