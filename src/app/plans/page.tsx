"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Crown, Check, Zap, Star, Shield } from "lucide-react";

interface Plan {
  id: number; name: string; price: number;
  discount_percent: number; duration_days: number; description: string;
}

const ICONS: Record<string, typeof Crown> = { Basic: Zap, Silver: Star, Gold: Crown, VIP: Shield };

const COLORS: Record<string, string> = {
  Basic: "#8b949e", Silver: "#a0a0a0", Gold: "#ffb800", VIP: "#58a6ff",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [user, setUser] = useState<{ id: number; balance: number } | null>(null);
  const [msg, setMsg] = useState("");
  const [buying, setBuying] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/plans").then((r) => r.json()).then((d) => { if (d.plans) setPlans(d.plans); }).catch(() => {});
    fetch("/api/auth/me").then((r) => r.json()).then((d) => { if (d.user) setUser(d.user); }).catch(() => {});
  }, []);

  const buy = async (planId: number) => {
    setMsg(""); setBuying(planId);
    try {
      const r = await fetch("/api/plans/purchase", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const d = await r.json();
      if (r.ok) {
        setMsg(`Purchased! You now get ${d.discount} off. Expires ${d.expires}`);
        if (d.balance !== undefined) setUser((prev) => prev ? { ...prev, balance: d.balance } : prev);
      } else setMsg(d.error || "Failed");
    } catch { setMsg("Error"); }
    setBuying(null);
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Subscription Plans</h1>
        <p className="text-sm text-[#8b949e]">Get discounts on every purchase. Plans last 30-60 days.</p>
        {user && <p className="text-xs text-[#8b949e] mt-1">Your balance: <span className="text-[#3fb950] font-semibold">${(user.balance || 0).toFixed(2)}</span></p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const Icon = ICONS[plan.name] || Crown;
          const color = COLORS[plan.name] || "#58a6ff";
          return (
            <div key={plan.id} className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 flex flex-col hover:border-[#58a6ff] transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
              </div>

              <p className="text-3xl font-bold text-white mb-1">${plan.price}</p>
              <p className="text-xs text-[#8b949e] mb-3">{plan.duration_days}-day plan</p>

              <div className="flex-1 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-[#c9d1d9]">
                  <Check className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />
                  <span>{plan.discount_percent}% off all purchases</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#c9d1d9]">
                  <Check className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />
                  <span>{plan.description}</span>
                </div>
              </div>

              <button onClick={() => buy(plan.id)} disabled={buying === plan.id || !user}
                className="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-opacity disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: color }}>
                {buying === plan.id ? "Purchasing..." : user ? "Buy Now" : "Login to Purchase"}
              </button>
            </div>
          );
        })}
      </div>

      {msg && (
        <div className={`mt-4 text-center text-sm ${msg.includes("Purchased") ? "text-[#3fb950]" : "text-[#f85149]"}`}>
          {msg}
        </div>
      )}

      {!user && (
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-[#58a6ff] hover:underline">Sign in to purchase a plan</Link>
        </div>
      )}
    </div>
  );
}
