"use client";

import Link from "next/link";
import { User, LogOut, Wallet, Shield, Menu, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { CATEGORIES } from "@/lib/constants";

interface AuthUser {
  id: number;
  username: string;
  balance: number;
  role: string;
}

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchUser = () => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else setUser(null);
      })
      .catch(() => setUser(null));
  };

  useEffect(() => {
    fetchUser();
    window.addEventListener("focus", fetchUser);
    return () => window.removeEventListener("focus", fetchUser);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="bg-[#0d1117] border-b border-[#30363d]">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#58a6ff] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LZT</span>
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">LZT Market</span>
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-[#21262d] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    window.location.href = `/?title=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
              />
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#c9d1d9] hover:text-white hover:bg-[#21262d] rounded-lg transition-colors"
                >
                  <Wallet className="w-4 h-4 text-[#3fb950]" />
                  <span className="hidden sm:inline font-medium">${(user.balance || 0).toFixed(2)}</span>
                  <User className="w-4 h-4" />
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl z-20 py-1">
                      <div className="px-3 py-2 border-b border-[#30363d]">
                        <p className="text-sm text-white font-medium">{user.username}</p>
                        <p className="text-xs text-[#8b949e]">Balance: <span className="text-[#3fb950]">${(user.balance || 0).toFixed(2)}</span></p>
                      </div>
                      <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#21262d]" onClick={() => setShowUserMenu(false)}>
                        <User className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link href="/orders" className="flex items-center gap-2 px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#21262d]" onClick={() => setShowUserMenu(false)}>
                        <span className="w-4 h-4 flex items-center justify-center text-xs">📦</span> My Orders
                      </Link>
                      <Link href="/plans" className="flex items-center gap-2 px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#21262d]" onClick={() => setShowUserMenu(false)}>
                        <span className="w-4 h-4 flex items-center justify-center text-xs">⭐</span> Plans
                      </Link>
                      {user.role === "admin" && (
                        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-[#d29922] hover:bg-[#21262d]" onClick={() => setShowUserMenu(false)}>
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#f85149] hover:bg-[#21262d]">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login-code" className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="md:hidden pb-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-[#21262d] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  window.location.href = `/?title=${encodeURIComponent(searchQuery.trim())}`;
                }
              }}
            />
          </div>
        </div>

        <div className="hidden md:flex items-center gap-0.5 pb-px overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug || "home"}
              href={cat.slug ? `/${cat.slug}` : "/"}
              className="px-3 py-2 text-xs text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-t-md transition-colors whitespace-nowrap"
            >
              {cat.title}
            </Link>
          ))}
        </div>

        <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden flex items-center gap-1 py-2 text-xs text-[#8b949e]">
          {mobileMenu ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
          <span>Categories</span>
        </button>
        {mobileMenu && (
          <div className="md:hidden pb-2 flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug || "home"}
                href={cat.slug ? `/${cat.slug}` : "/"}
                className="px-2.5 py-1.5 text-xs text-[#c9d1d9] bg-[#21262d] rounded-md hover:bg-[#30363d] transition-colors"
                onClick={() => setMobileMenu(false)}
              >
                {cat.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
