"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Bell, Palette, User, KeyRound, Save } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiFetch, cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { id: "security", label: "Security", icon: <KeyRound className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState<any>({});
  const [user, setUser] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/settings/").then(setSettings).catch(() => {});
    apiFetch("/auth/me").then(setUser).catch(() => {});
  }, []);

  async function save() {
    await apiFetch("/settings/", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-shell flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <div className="px-6 pb-10 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your account, preferences, and platform settings</p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-5">
            {/* Tabs */}
            <div className="w-full md:w-56 shrink-0 space-y-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeTab === t.id
                      ? "bg-accent-green/10 text-accent-green shadow-[0_0_12px_rgba(181,240,35,0.08)]"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 bg-card rounded-card p-6 border border-border-card shadow-card"
            >
              {activeTab === "profile" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <img src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} alt="" className="w-16 h-16 rounded-full border border-border-subtle object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-text-muted">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#2a2a2a] text-white border-border-subtle uppercase">
                        {user.role?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-secondary mb-1.5 block">First Name</label>
                      <input className="input-field w-full text-sm" defaultValue={user.first_name} />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary mb-1.5 block">Last Name</label>
                      <input className="input-field w-full text-sm" defaultValue={user.last_name} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block">Email</label>
                    <input className="input-field w-full text-sm" defaultValue={user.email} disabled />
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Change Password</h3>
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block">Current Password</label>
                    <input type="password" className="input-field w-full text-sm" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block">New Password</label>
                    <input type="password" className="input-field w-full text-sm" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1.5 block">Confirm New Password</label>
                    <input type="password" className="input-field w-full text-sm" placeholder="••••••••" />
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Notification Preferences</h3>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1e1e1e]/60 border border-border-subtle">
                    <div>
                      <p className="text-sm text-text-primary font-medium">Email Notifications</p>
                      <p className="text-[11px] text-text-muted">Receive alerts via email</p>
                    </div>
                    <button
                      onClick={() => setSettings((s: any) => ({ ...s, email_notifications: !s.email_notifications }))}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative",
                        settings.email_notifications ? "bg-accent-green" : "bg-[#2a2a2a]"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                        settings.email_notifications ? "translate-x-5" : ""
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#1e1e1e]/60 border border-border-subtle">
                    <div>
                      <p className="text-sm text-text-primary font-medium">Push Notifications</p>
                      <p className="text-[11px] text-text-muted">Browser push alerts</p>
                    </div>
                    <button
                      onClick={() => setSettings((s: any) => ({ ...s, push_notifications: !s.push_notifications }))}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative",
                        settings.push_notifications ? "bg-accent-green" : "bg-[#2a2a2a]"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                        settings.push_notifications ? "translate-x-5" : ""
                      )} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold text-text-primary mb-2">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["dark", "light", "system"].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSettings((s: any) => ({ ...s, theme: t }));
                          if (t === "dark") {
                            document.documentElement.classList.add("dark");
                            document.documentElement.classList.remove("light");
                          } else if (t === "light") {
                            document.documentElement.classList.remove("dark");
                            document.documentElement.classList.add("light");
                          }
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-center transition-all capitalize",
                          settings.theme === t
                            ? "border-accent-green bg-accent-green/5 text-accent-green"
                            : "border-border-subtle bg-[#1e1e1e] text-text-secondary hover:text-text-primary"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full mx-auto mb-2 border border-border-subtle" style={{
                          background: t === "dark" ? "#111" : t === "light" ? "#fff" : "linear-gradient(135deg, #111 50%, #fff 50%)"
                        }} />
                        <span className="text-xs font-medium">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs text-text-muted">{saved ? "Saved successfully" : "Unsaved changes"}</span>
                <button onClick={save} className="btn-primary text-xs flex items-center gap-2">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
