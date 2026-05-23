"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ChevronDown, LayoutDashboard, ScanLine, Inbox,
  BarChart3, Brain, Database, FileText, Settings, HelpCircle,
  CreditCard, MessageSquare, Bell, Users, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  {
    label: "Sentinel-Shield",
    icon: <Shield className="w-5 h-5" />,
    children: [
      { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Platform Analytics", href: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "System Alerts", href: "/cases", icon: <Bell className="w-4 h-4" /> },
    ],
  },
  {
    label: "Sentinel-Phishing",
    icon: <ScanLine className="w-5 h-5" />,
    badge: 3,
    children: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "Detection Workspace", href: "/detection", icon: <ScanLine className="w-4 h-4" /> },
      { label: "Analyst Queue", href: "/cases", icon: <Inbox className="w-4 h-4" /> },
      { label: "Analytics", href: "/analytics", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "Threat Insights", href: "/analytics", icon: <Brain className="w-4 h-4" /> },
      { label: "Model Management", href: "/models", icon: <Database className="w-4 h-4" /> },
      { label: "Training & Dataset", href: "/models", icon: <Database className="w-4 h-4" /> },
      { label: "Reports", href: "/analytics", icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    label: "Sentinel-Cards",
    href: "/sentinel-cards",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    label: "AI Assistant",
    href: "/chat",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: "Admin",
    href: "/admin",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    label: "Help",
    href: "/help",
    icon: <HelpCircle className="w-5 h-5" />,
  },
];

function FolderItem({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const hasChildren = !!item.children;
  const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;
  const anyChildActive = item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  const [open, setOpen] = useState(anyChildActive || depth === 0);

  if (!hasChildren) {
    return (
      <Link
        href={item.href || "#"}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-[#b5f023]/10 text-[#b5f023] shadow-[0_0_12px_rgba(181,240,35,0.12)]"
            : "text-[#9a9a9a] hover:text-white hover:bg-white/[0.03]"
        )}
      >
        <span className={cn(isActive && "text-[#b5f023]")}>{item.icon}</span>
        <span>{item.label}</span>
        {item.badge ? (
          <span className="ml-auto bg-[#b5f023] text-[#0f0f0f] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-sm font-medium transition-all",
          anyChildActive ? "text-white" : "text-[#9a9a9a] hover:text-white hover:bg-white/[0.03]"
        )}
      >
        <span>{item.icon}</span>
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge ? (
          <span className="bg-[#b5f023] text-[#0f0f0f] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        ) : null}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="relative pl-4 mt-1 space-y-0.5">
              <div className="absolute left-[1.15rem] top-1 bottom-1 w-px bg-white/5" />
              {item.children?.map((child) => {
                const childActive = pathname === child.href;
                return (
                  <Link
                    key={child.label}
                    href={child.href || "#"}
                    className={cn(
                      "flex items-center gap-3 pl-6 pr-3 py-2 rounded-[12px] text-sm transition-all relative",
                      childActive
                        ? "bg-[#b5f023]/10 text-[#b5f023]"
                        : "text-[#9a9a9a] hover:text-white hover:bg-white/[0.03]"
                    )}
                  >
                    {childActive && (
                      <span className="absolute left-[1.15rem] w-1.5 h-1.5 rounded-full bg-[#b5f023] -translate-x-1/2" />
                    )}
                    <span className={cn(childActive && "text-[#b5f023]")}>{child.icon}</span>
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-[#1a1a1a] rounded-xl border border-[rgba(255,255,255,0.04)] shadow-[0_8px_40px_rgba(0,0,0,0.6)] lg:hidden"
      >
        <Shield className="w-5 h-5 text-[#b5f023]" />
      </button>

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-[280px] bg-[#111111] border-r border-[rgba(255,255,255,0.06)] flex flex-col z-40 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#b5f023] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#0f0f0f]" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Sentinel-Shield</h1>
              <p className="text-[11px] text-[#555555] uppercase tracking-wider font-semibold">SOC Platform</p>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV.map((item) => (
              <FolderItem key={item.label} item={item} />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[rgba(255,255,255,0.06)]">
          {user && (
            <div className="flex items-center gap-3 mb-4">
              <img src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} alt="" className="w-10 h-10 rounded-full object-cover border border-[rgba(255,255,255,0.06)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-[#555555] truncate capitalize">{user.role?.replace("_", " ")}</p>
              </div>
            </div>
          )}
          <button onClick={logout} className="flex items-center gap-2 text-sm text-[#9a9a9a] hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
}
