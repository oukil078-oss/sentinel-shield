"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bell, Search, Moon, Sun, Zap, Calendar, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function TopBar() {
  const { user } = useAuth();
  const [isDark, setIsDark] = React.useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    document.documentElement.classList.toggle("light");
  };

  return (
    <header className="sticky top-4 z-30 mx-6 mb-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "flex items-center justify-between px-5 py-3 rounded-[24px] bg-[#1a1a1a]/80 backdrop-blur-xl border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
        )}
      >
        <div className="flex items-center gap-4">
          {/* Avatar Stack */}
          <div className="flex items-center gap-2 bg-[#1e1e1e] rounded-full px-3 py-1.5 border border-[rgba(255,255,255,0.06)]">
            <div className="flex -space-x-2">
              {[1,2,3].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/150?u=analyst${i}`}
                  alt=""
                  className="w-6 h-6 rounded-full border-2 border-[#1e1e1e] object-cover"
                />
              ))}
            </div>
            <span className="text-xs text-[#9a9a9a] ml-1">Team online</span>
            <span className="w-2 h-2 rounded-full bg-[#b5f023] animate-pulse ml-1" />
          </div>

          {/* Live Badge */}
          <div className="hidden md:flex items-center gap-2 bg-[#b5f023]/10 text-[#b5f023] rounded-full px-3 py-1.5 text-xs font-semibold border border-[#b5f023]/20">
            <Zap className="w-3.5 h-3.5" />
            Live Threat Feed
          </div>
        </div>

        {/* Center Stats */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-[#9a9a9a]">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <div className="h-4 w-px bg-[rgba(255,255,255,0.06)]" />
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b5f023]" />
              <span className="text-white">34</span>
              <span className="text-[#555555]">detections</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-white">20</span>
              <span className="text-[#555555]">suspicious</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-white">3</span>
              <span className="text-[#555555]">critical</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-[#1e1e1e] rounded-xl px-3 py-2 border border-[rgba(255,255,255,0.06)] w-64">
            <Search className="w-4 h-4 text-[#555555] mr-2" />
            <input
              placeholder="Search detections, cases..."
              className="bg-transparent text-sm text-white placeholder:text-[#555555] outline-none w-full"
            />
          </div>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#9a9a9a] hover:text-white transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button className="relative w-9 h-9 rounded-xl bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#9a9a9a] hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-3 border-l border-[rgba(255,255,255,0.06)]">
              <img
                src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-[rgba(255,255,255,0.06)]"
              />
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-white">{user.first_name} {user.last_name}</p>
                <p className="text-[10px] text-[#555555] capitalize">{user.role?.replace("_", " ")}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </header>
  );
}
