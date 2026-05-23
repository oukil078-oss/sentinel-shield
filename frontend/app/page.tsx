"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, ArrowRight, Lock, Mail, Globe, Settings, Terminal } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("zakaryaoukil2003@gmail.com");
  const [password, setPassword] = useState("Zakarya@2026Secure");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showLocalHelp, setShowLocalHelp] = useState(false);
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("api_base_url") || "http://localhost:8000/api/v1";
    }
    return "http://localhost:8000/api/v1";
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, remember);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const saveApiUrl = () => {
    localStorage.setItem("api_base_url", apiUrl);
    setShowApiConfig(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-[1120px] grid lg:grid-cols-2 gap-0 bg-[#1a1a1a] rounded-[32px] border border-[rgba(255,255,255,0.04)] shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Left: Visual */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#111]" />
            <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#b5f023]/10 blur-[140px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#b5f023]/5 blur-[120px]" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="w-10 h-10 rounded-xl bg-[#b5f023] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#0f0f0f]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Sentinel-Shield</h2>
                <p className="text-[10px] text-[#555555] uppercase tracking-widest font-semibold">AI-Powered Threat Intelligence</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
              <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                Built for the<br />
                <span className="text-[#b5f023]">Modern SOC</span>
              </h1>
              <p className="text-sm text-[#9a9a9a] max-w-sm leading-relaxed">
                Detect phishing, analyze threats, and manage incidents with AI precision. Enterprise-grade security operations in one unified workspace.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <img src="https://i.pravatar.cc/150?u=analyst1" alt="" className="w-10 h-10 rounded-full border-2 border-[#1a1a1a] object-cover" />
              <img src="https://i.pravatar.cc/150?u=analyst2" alt="" className="w-10 h-10 rounded-full border-2 border-[#1a1a1a] object-cover -ml-3" />
              <img src="https://i.pravatar.cc/150?u=analyst3" alt="" className="w-10 h-10 rounded-full border-2 border-[#1a1a1a] object-cover -ml-3" />
              <div className="ml-2">
                <p className="text-sm font-semibold text-white">500+ Analysts Protected</p>
                <p className="text-xs text-[#555555]">Across Fortune 500 enterprises</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-[#111111]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-sm text-[#9a9a9a]">Sign in to your Sentinel-Shield workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#9a9a9a] mb-2">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] rounded-[12px] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#b5f023] transition-all"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9a9a9a] mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] rounded-[12px] pl-10 pr-10 py-3 text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#b5f023] transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555555] hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-[#9a9a9a] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-[rgba(255,255,255,0.06)] bg-[#1e1e1e] text-[#b5f023] focus:ring-[#b5f023]"
                  />
                  Remember me
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowLocalHelp(!showLocalHelp)} className="text-[#b5f023] hover:underline font-medium flex items-center gap-1">
                    <Terminal className="w-3 h-3" /> Local Setup
                  </button>
                  <button type="button" onClick={() => setShowApiConfig(!showApiConfig)} className="text-[#b5f023] hover:underline font-medium flex items-center gap-1">
                    <Settings className="w-3 h-3" /> Backend URL
                  </button>
                </div>
              </div>

              {showLocalHelp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-4 space-y-3"
                >
                  <p className="text-xs text-[#9a9a9a] font-medium">Running locally on Arch Linux:</p>
                  <div className="bg-[#0f0f0f] rounded-[12px] p-3 border border-[rgba(255,255,255,0.04)]">
                    <code className="text-[11px] text-[#b5f023] font-mono block whitespace-pre">
{`# Option 1: Docker (easiest)
sudo pacman -S docker docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER
# LOG OUT AND BACK IN, then:
docker-compose -f docker-compose.local.yml up -d --build

# Option 2: Native (no Docker)
cd backend && python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -c "from app.db.database import init_db; init_db()"
python -c "from app.db.seed import seed_all; seed_all()"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# In another terminal:
cd frontend && npm install && npm run dev`}
                    </code>
                  </div>
                  <p className="text-[10px] text-[#555555]">
                    Full guide: <span className="text-[#9a9a9a]">ARCH_LINUX_GUIDE.md</span> in repo root
                  </p>
                </motion.div>
              )}

              {showApiConfig && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="w-full bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] rounded-[12px] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#b5f023] transition-all"
                      placeholder="http://localhost:8000/api/v1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveApiUrl}
                    className="w-full bg-[#2a2a2a] text-white text-xs font-medium rounded-[12px] px-4 py-2 border border-[rgba(255,255,255,0.06)] hover:bg-[#333] transition-all"
                  >
                    Save Backend URL
                  </button>
                  <p className="text-[10px] text-[#555555]">
                    Default: http://localhost:8000/api/v1 (for local development)
                  </p>
                </motion.div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-[12px] px-3 py-2.5"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#b5f023] text-[#0f0f0f] font-semibold rounded-[14px] px-5 py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-[#0f0f0f]/30 border-t-[#0f0f0f] rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
              <p className="text-[11px] text-[#555555] mb-3 uppercase tracking-wider font-semibold">Demo Credentials</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-[#1e1e1e] rounded-[12px] px-3 py-2 border border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#9a9a9a]">Super Admin</span>
                  <span className="text-white font-mono">zakaryaoukil2003@gmail.com / Zakarya@2026Secure</span>
                </div>
                <div className="flex items-center justify-between bg-[#1e1e1e] rounded-[12px] px-3 py-2 border border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#9a9a9a]">Analyst</span>
                  <span className="text-white font-mono">analyst@sentinel-shield.io / Analyst@2026</span>
                </div>
                <div className="flex items-center justify-between bg-[#1e1e1e] rounded-[12px] px-3 py-2 border border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#9a9a9a]">Manager</span>
                  <span className="text-white font-mono">manager@sentinel-shield.io / Manager@2026</span>
                </div>
                <div className="flex items-center justify-between bg-[#1e1e1e] rounded-[12px] px-3 py-2 border border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#9a9a9a]">Viewer</span>
                  <span className="text-white font-mono">viewer@sentinel-shield.io / Viewer@2026</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
