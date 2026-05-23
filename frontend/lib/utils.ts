import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getApiBase(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("api_base_url");
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
}

export const API_BASE = getApiBase();

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
  const base = typeof window !== "undefined" 
    ? (localStorage.getItem("api_base_url") || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");
  
  try {
    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/";
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "Request failed");
    }
    return res.json();
  } catch (e: any) {
    if (e.name === "TypeError") {
      throw new Error("Cannot connect to API server. Make sure the backend is running on http://localhost:8000");
    }
    throw e;
  }
}

export function formatDate(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function riskColor(score: number, label?: string) {
  if (label === "phishing" || score >= 80) return "bg-red-500";
  if (label === "suspicious" || score >= 50) return "bg-amber-500";
  if (label === "spam") return "bg-violet-500";
  return "bg-emerald-500";
}

export function labelBadgeClass(label: string) {
  switch (label) {
    case "phishing": return "bg-red-500/15 text-red-400 border-red-500/20";
    case "suspicious": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    case "spam": return "bg-violet-500/15 text-violet-400 border-violet-500/20";
    case "safe": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    default: return "bg-[#2a2a2a] text-white border-border-subtle";
  }
}
