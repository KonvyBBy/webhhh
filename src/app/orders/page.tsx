"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from "lucide-react";

interface Order {
  id: number;
  item_id: number;
  title: string | null;
  price: number | null;
  currency: string | null;
  credentials: string | null;
  status: string;
  created_at: string;
}

function parseCreds(credentials: string) {
  try {
    const c = JSON.parse(credentials);
    if (c.status === "ok" && c.item) {
      const item = c.item;
      const ld = item.loginData || {};
      const ed = item.emailLoginData || {};
      return {
        login: item.login || ld.login || "",
        password: ld.password || "",
        email: ed.login || "",
        emailPassword: ed.password || "",
        emailOldPassword: ed.oldPassword || "",
        emailSecretAnswer: ed.newSecretAnswer || "",
        emailLoginUrl: ed.emailLoginUrl || item.emailLoginUrl || "",
        domain: item.domain || ed.domain || "",
      };
    }
    if (c.login || c.email) return c;
  } catch { /* */ }
  return null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => { if (d.orders) setOrders(d.orders); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) return <div className="max-w-[800px] mx-auto px-4 py-12 text-center text-[#8b949e]">Loading...</div>;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold text-white mb-5">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-[#161b22] border border-[#30363d] rounded-lg">
          <ShoppingBag className="w-10 h-10 text-[#8b949e] mx-auto mb-3" />
          <p className="text-[#8b949e] text-sm">No orders yet</p>
          <Link href="/fortnite" className="inline-block mt-3 text-sm text-[#58a6ff] hover:underline">Browse accounts</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const creds = parseCreds(order.credentials || "");
            const open = expandedId === order.id;

            return (
              <div key={order.id} className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
                <button onClick={() => setExpandedId(open ? null : order.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#21262d]/50 transition-colors text-left">
                  <div className="w-9 h-9 bg-[#21262d] rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-[#58a6ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{order.title || `Item #${order.item_id}`}</p>
                    <p className="text-xs text-[#8b949e]">{order.created_at?.slice(0, 10)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">{order.currency || "$"}{Number(order.price || 0).toFixed(2)}</p>
                    <span className="text-xs text-[#3fb950]">{order.status}</span>
                  </div>
                  {open ? <ChevronUp className="w-4 h-4 text-[#8b949e]" /> : <ChevronDown className="w-4 h-4 text-[#8b949e]" />}
                </button>

                {open && creds && (
                  <div className="border-t border-[#30363d]">
                    {/* Game Login */}
                    <div className="px-3 pt-3 pb-2">
                      <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Account Login</h3>
                      <div className="bg-[#0d1117] border border-[#21262d] rounded-lg divide-y divide-[#21262d]">
                        {creds.login && (
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[#8b949e] text-xs shrink-0 w-14">Login</span>
                              <code className="text-xs text-[#c9d1d9] break-all font-mono">{creds.login}</code>
                            </div>
                            <button onClick={() => copy(creds.login, `login-${order.id}`)}
                              className="shrink-0 ml-2 p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors">
                              {copiedField === `login-${order.id}` ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                        {creds.password && (
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-[#8b949e] text-xs shrink-0 w-14">Password</span>
                              <code className="text-xs text-[#c9d1d9] break-all font-mono">{creds.password}</code>
                            </div>
                            <button onClick={() => copy(creds.password, `pass-${order.id}`)}
                              className="shrink-0 ml-2 p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors">
                              {copiedField === `pass-${order.id}` ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Access */}
                    {(creds.email || creds.emailPassword) && (
                      <div className="px-3 pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Email Access</h3>
                          <span className="text-[10px] text-[#8b949e]">({creds.domain || "autoreg"})</span>
                        </div>
                        <div className="bg-[#0d1117] border border-[#21262d] rounded-lg divide-y divide-[#21262d] mb-2">
                          {creds.email && (
                            <div className="flex items-center justify-between px-3 py-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-[#8b949e] text-xs shrink-0 w-14">Login</span>
                                <code className="text-xs text-[#c9d1d9] break-all font-mono">{creds.email}</code>
                              </div>
                              <button onClick={() => copy(creds.email, `email-${order.id}`)}
                                className="shrink-0 ml-2 p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors">
                                {copiedField === `email-${order.id}` ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                          {creds.emailPassword && (
                            <div className="flex items-center justify-between px-3 py-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-[#8b949e] text-xs shrink-0 w-14">Password</span>
                                <code className="text-xs text-[#c9d1d9] break-all font-mono">{creds.emailPassword}</code>
                              </div>
                              <button onClick={() => copy(creds.emailPassword, `emailpass-${order.id}`)}
                                className="shrink-0 ml-2 p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors">
                                {copiedField === `emailpass-${order.id}` ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Old password & secret answer */}
                        {(creds.emailOldPassword || creds.emailSecretAnswer) && (
                          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg divide-y divide-[#21262d] mb-2">
                            {creds.emailOldPassword && (
                              <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-[#8b949e] text-xs shrink-0 w-14">Old pwd</span>
                                  <code className="text-xs text-[#8b949e] break-all font-mono">{creds.emailOldPassword}</code>
                                </div>
                                <button onClick={() => copy(creds.emailOldPassword, `oldpass-${order.id}`)}
                                  className="shrink-0 ml-2 p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors">
                                  {copiedField === `oldpass-${order.id}` ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                            {creds.emailSecretAnswer && (
                              <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-[#8b949e] text-xs shrink-0 w-14">Secret</span>
                                  <code className="text-xs text-[#d29922] break-all font-mono">{creds.emailSecretAnswer}</code>
                                </div>
                                <button onClick={() => copy(creds.emailSecretAnswer, `secret-${order.id}`)}
                                  className="shrink-0 ml-2 p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors">
                                  {copiedField === `secret-${order.id}` ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Email buttons */}
                        <div className="flex flex-wrap gap-2">
                          {creds.emailLoginUrl && (
                            <a href={creds.emailLoginUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" /> Login to mail
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {!creds && <div className="px-3 pb-3 pt-2 text-xs text-[#f85149]">Could not parse credentials</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
