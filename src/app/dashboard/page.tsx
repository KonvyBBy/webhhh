"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Wallet, ShoppingBag, Shield, Camera, Save, Mail } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<{
    id: number; username: string; display_name: string | null;
    email: string; avatar_url: string; balance: number; role: string; created_at: string;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setEditName(data.user.display_name || data.user.username);
          setEditEmail(data.user.email || "");
          setEditAvatar(data.user.avatar_url || "");
        }
      })
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: editName, email: editEmail, avatar_url: editAvatar }),
      });
      const d = await r.json();
      if (d.user) {
        setUser((prev) => prev ? { ...prev, ...d.user } : null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* */ }
    setSaving(false);
  };

  const avatarSrc = user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username || "U")}&background=58a6ff&color=fff&size=128`;

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-white mb-6">Dashboard</h1>

      {user ? (
        <>
          {/* Profile Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <img src={avatarSrc} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[#30363d]"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.username[0]}&background=58a6ff&color=fff&size=128`; }} />
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#238636] hover:bg-[#2ea043] rounded-full flex items-center justify-center cursor-pointer transition-colors overflow-hidden">
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const fd = new FormData();
                    fd.append("avatar", file);
                    try {
                      const r = await fetch("/api/upload-avatar", { method: "POST", body: fd });
                      const d = await r.json();
                      if (d.avatar_url) {
                        setEditAvatar(d.avatar_url);
                        setUser((prev) => prev ? { ...prev, avatar_url: d.avatar_url } : prev);
                      }
                    } catch { /* */ }
                    setUploading(false);
                  }} />
                </label>
                {uploading && <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full text-[10px] text-white">...</span>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg font-semibold text-white">{user.display_name || user.username}</span>
                  {user.role === "admin" && <span className="text-xs bg-[#d29922]/20 text-[#d29922] px-2 py-0.5 rounded-full">Admin</span>}
                </div>
                <p className="text-xs text-[#8b949e]">@{user.username} · Joined {user.created_at?.slice(0, 10)}</p>
              </div>

              {/* Balance */}
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-white flex items-center gap-1.5">
                  <Wallet className="w-5 h-5 text-[#3fb950]" />
                  ${(user.balance || 0).toFixed(2)}
                </p>
                <p className="text-xs text-[#8b949e]">Balance</p>
              </div>
            </div>

            {/* Edit Form */}
            <div className="mt-5 pt-5 border-t border-[#21262d]">
              <h3 className="text-sm font-semibold text-white mb-3">Edit Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-[#8b949e] mb-1 block">Display Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" />
                </div>
                <div>
                  <label className="text-xs text-[#8b949e] mb-1 block">Email</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" />
                </div>
                <div>
                  <label className="text-xs text-[#8b949e] mb-1 block">Avatar URL</label>
                  <input type="text" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="https://..."
                    className="w-full h-9 px-3 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]" />
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-sm rounded-lg transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/orders" className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#21262d] text-[#58a6ff]"><ShoppingBag className="w-5 h-5" /></div>
                <div><p className="text-sm font-medium text-white group-hover:text-[#58a6ff] transition-colors">My Orders</p><p className="text-xs text-[#8b949e]">View purchased accounts</p></div>
              </div>
            </Link>
            {user.role === "admin" && (
              <Link href="/admin" className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-[#21262d] text-[#d29922]"><Shield className="w-5 h-5" /></div>
                  <div><p className="text-sm font-medium text-white group-hover:text-[#58a6ff] transition-colors">Admin Panel</p><p className="text-xs text-[#8b949e]">Manage users &amp; orders</p></div>
                </div>
              </Link>
            )}
          </div>
        </>
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center">
          <p className="text-[#8b949e] mb-3">Please login to view your dashboard</p>
          <Link href="/login-code" className="inline-block px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm rounded-lg">Sign In with Discord</Link>
        </div>
      )}
    </div>
  );
}
