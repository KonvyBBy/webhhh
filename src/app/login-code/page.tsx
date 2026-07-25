"use client";

import { useState } from "react";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/discord/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) window.location.href = "/";
      else setError(data.error || "Invalid code");
    } catch { setError("Network error"); }
    setLoading(false);
  };

  return (
    <div className="max-w-[400px] mx-auto px-4 py-12">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-[#5865F2]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Konvy Accounts</h1>
        <p className="text-xs text-[#8b949e] mb-6">
          Type <code className="text-[#58a6ff]">!panel</code> in our Discord server to get your login code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6}
            className="w-full h-12 text-center text-lg tracking-[0.5em] font-mono bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] uppercase" required />
          {error && <p className="text-xs text-[#f85149]">{error}</p>}
          <button type="submit" disabled={loading || code.length < 4}
            className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
