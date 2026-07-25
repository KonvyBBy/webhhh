"use client";

import { useState, useEffect } from "react";

interface User { id: number; username: string; display_name: string | null; email: string; balance: number; role: string; created_at: string; }
interface Order { id: number; user_id: number; buyer_username?: string; item_id: number; title: string | null; price: number | null; currency: string | null; status: string; created_at: string; }
interface Log { id: number; user_id: number; amount: number; type: string; note: string; created_at: string; }
interface UserPlan { id: number; plan_id: number; purchased_at: string; expires_at: string; active: boolean; }

const TABS = ["Dashboard", "Users", "Orders", "Settings", "Logs"];

export default function AdminPage() {
  const [tab, setTab] = useState("Dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [search, setSearch] = useState("");
  const [markup, setMarkup] = useState(1.0);
  const [markupMsg, setMarkupMsg] = useState("");
  const [plansData, setPlansData] = useState<{ id: number; name: string; price: number; discount_percent: number; duration_days: number; description: string }[]>([]);
  const [selUser, setSelUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Balance management
  const [bUserId, setBUserId] = useState("");
  const [bAmount, setBAmount] = useState("");
  const [bNote, setBNote] = useState("");
  const [bAction, setBAction] = useState<"add" | "remove" | "set">("add");
  const [bMsg, setBMsg] = useState("");
  const [bLoading, setBLoading] = useState(false);
  const [previewUser, setPreviewUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchOrders();
    fetch("/api/admin/settings").then((r) => r.json()).then((d) => {
      if (d.settings) setMarkup(d.settings.markup);
    }).catch(() => {});
    fetch("/api/plans").then((r) => r.json()).then((d) => { if (d.plans) setPlansData(d.plans); }).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    const r = await fetch("/api/admin/users"); const d = await r.json();
    if (d.users) setUsers(d.users);
  };
  const fetchOrders = async () => {
    const r = await fetch("/api/orders"); const d = await r.json();
    if (d.orders) setOrders(d.orders);
  };
  const fetchLogs = async () => {
    try { const r = await fetch("/api/orders"); const d = await r.json(); } catch { /* */ }
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.created_at?.startsWith(today));
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.price || 0), 0);
  const activeUsers = new Set(orders.slice(0, 100).map((o) => o.user_id)).size;

  // Balance handler
  const handleBalance = async (e: React.FormEvent) => {
    e.preventDefault(); setBMsg(""); setBLoading(true);
    try {
      const r = await fetch("/api/admin/balance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(bUserId), amount: Number(bAmount), action: bAction, note: bNote }),
      });
      const d = await r.json();
      if (r.ok) {
        const a = { add: "Added", remove: "Removed", set: "Set" }[bAction];
        setBMsg(`${a} $${bAmount} → ${d.user?.username} (Now: $${d.newBalance})`);
        setBUserId(""); setBAmount(""); setBNote(""); setPreviewUser(null);
        fetchUsers();
      } else setBMsg(d.error || "Failed");
    } catch { setBMsg("Error"); }
    setBLoading(false);
  };

  useEffect(() => {
    setPreviewUser(null);
    const id = Number(bUserId);
    if (!id) return;
    const f = users.find((u) => u.id === id);
    if (f) setPreviewUser(f);
  }, [bUserId, users]);

  const [userLogs, setUserLogs] = useState<Log[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [userDetailTab, setUserDetailTab] = useState<"orders" | "logs" | "plans">("orders");

  // View user details
  const viewUser = async (u: User) => {
    setSelUser(u);
    setUserDetailTab("orders");
    try {
      const r = await fetch(`/api/admin/user-logs?userId=${u.id}`);
      const d = await r.json();
      if (d.orders) setUserOrders(d.orders);
      if (d.logs) setUserLogs(d.logs);
      if (d.userPlans) setUserPlans(d.userPlans);
    } catch { /* */ }
  };

  const aColor = bAction === "add" ? "#238636" : bAction === "remove" ? "#f85149" : "#d29922";
  const aLabel = { add: "Add", remove: "Remove", set: "Set" }[bAction];

  const searchLower = search.toLowerCase();
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchLower) ||
    String(u.id).includes(search) ||
    (u.email || "").toLowerCase().includes(searchLower)
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-white mb-4">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#30363d] pb-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors whitespace-nowrap ${tab === t ? "bg-[#21262d] text-white border-b-2 border-[#58a6ff]" : "text-[#8b949e] hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* === DASHBOARD === */}
      {tab === "Dashboard" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              ["Today's Revenue", `$${todayRevenue.toFixed(2)}`, "#3fb950"],
              ["Orders Today", String(todayOrders.length), "#58a6ff"],
              ["Total Users", String(users.length), "#d29922"],
              ["Active Buyers", String(activeUsers), "#f85149"],
            ].map(([label, val, color]) => (
              <div key={label} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <p className="text-xs text-[#8b949e]">{label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Recent Orders</h2>
            <div className="space-y-1">
              {orders.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#21262d] last:border-0 text-xs">
                  <span className="text-[#8b949e]">#{o.id}</span>
                  <span className="text-[#c9d1d9] flex-1 ml-2 truncate">{o.title || `Item #${o.item_id}`}</span>
                  <span className="text-[#8b949e]">{o.buyer_username || `User #${o.user_id}`}</span>
                  <span className="text-white font-medium ml-2">{o.currency || "$"}{Number(o.price || 0).toFixed(2)}</span>
                </div>
              ))}
              {orders.length === 0 && <p className="text-xs text-[#8b949e] text-center py-4">No orders yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* === USERS === */}
      {tab === "Users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* User list */}
          <div className="lg:col-span-2">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4">
              <input type="text" placeholder="Search by ID, username, or email..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]" />
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[#30363d] text-left">
                    <th className="px-3 py-2.5 text-xs text-[#8b949e]">ID</th>
                    <th className="px-3 py-2.5 text-xs text-[#8b949e]">User</th>
                    <th className="px-3 py-2.5 text-xs text-[#8b949e]">Balance</th>
                    <th className="px-3 py-2.5 text-xs text-[#8b949e]">Role</th>
                    <th className="px-3 py-2.5 text-xs text-[#8b949e]">Orders</th>
                  </tr></thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[#21262d] hover:bg-[#21262d]/50 cursor-pointer" onClick={() => viewUser(u)}>
                        <td className="px-3 py-2.5 text-[#8b949e]">{u.id}</td>
                        <td className="px-3 py-2.5 text-white">{u.username}</td>
                        <td className="px-3 py-2.5 text-[#3fb950] font-medium">${(u.balance || 0).toFixed(2)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === "admin" ? "bg-[#d29922]/20 text-[#d29922]" : "bg-[#21262d] text-[#8b949e]"}`}>{u.role}</span>
                        </td>
                        <td className="px-3 py-2.5 text-[#8b949e]">{orders.filter((o) => o.user_id === u.id).length}</td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#8b949e] text-xs">No users found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User detail / Balance panel */}
          <div>
            {selUser ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4">
                {/* User header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#21262d] rounded-full flex items-center justify-center text-white font-semibold">{selUser.username[0].toUpperCase()}</div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{selUser.display_name || selUser.username}</p>
                    <p className="text-xs text-[#8b949e]">ID: {selUser.id} · {selUser.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${(selUser.balance || 0).toFixed(2)}</p>
                    <p className="text-xs text-[#8b949e]">Balance</p>
                  </div>
                  <button onClick={() => {
                    if (window.confirm(`Delete user "${selUser.username}" (ID: ${selUser.id})? This cannot be undone.`)) {
                      fetch("/api/admin/delete-user", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: selUser.id }),
                      }).then((r) => r.json()).then((d) => {
                        if (d.success) { setSelUser(null); fetchUsers(); }
                        else alert(d.error || "Failed");
                      }).catch(() => alert("Error"));
                    }
                  }}
                    className="shrink-0 px-2 py-1 text-xs bg-[#f85149]/20 text-[#f85149] rounded hover:bg-[#f85149]/30 transition-colors">
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-[#8b949e]">Email:</span> <span className="text-white">{selUser.email || "—"}</span></div>
                  <div><span className="text-[#8b949e]">Joined:</span> <span className="text-white">{selUser.created_at?.slice(0, 10)}</span></div>
                  <div><span className="text-[#8b949e]">Orders:</span> <span className="text-white">{userOrders.length}</span></div>
                  <div><span className="text-[#8b949e]">Transactions:</span> <span className="text-white">{userLogs.length}</span></div>
                </div>

                {/* Detail tabs */}
                <div className="flex gap-1 mb-2 border-b border-[#21262d] pb-1">
                  {(["orders", "logs", "plans"] as const).map((t) => (
                    <button key={t} onClick={() => setUserDetailTab(t)}
                      className={`text-xs px-2 py-1 rounded-t transition-colors ${userDetailTab === t ? "text-white bg-[#21262d]" : "text-[#8b949e] hover:text-white"}`}>
                      {t === "orders" ? `Orders (${userOrders.length})` : t === "logs" ? `Logs (${userLogs.length})` : `Plans (${userPlans.length})`}
                    </button>
                  ))}
                </div>

                {/* Orders */}
                {userDetailTab === "orders" && (
                  <div className="max-h-[300px] overflow-y-auto space-y-1">
                    {userOrders.length === 0 ? <p className="text-xs text-[#8b949e] text-center py-4">No orders</p> :
                    userOrders.map((o) => (
                      <div key={o.id} className="bg-[#0d1117] border border-[#21262d] rounded p-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white truncate flex-1">{o.title || `Item #${o.item_id}`}</span>
                          <span className="text-white font-medium shrink-0 ml-2">{o.currency || "$"}{Number(o.price || 0).toFixed(2)}</span>
                        </div>
                        <span className="text-[#8b949e] text-[10px]">{o.created_at?.slice(0, 19).replace("T", " ")}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Balance Logs */}
                {userDetailTab === "logs" && (
                  <div className="max-h-[300px] overflow-y-auto space-y-1">
                    {userLogs.length === 0 ? <p className="text-xs text-[#8b949e] text-center py-4">No activity</p> :
                    userLogs.map((l) => (
                      <div key={l.id} className="bg-[#0d1117] border border-[#21262d] rounded p-2 text-xs">
                        <div className="flex justify-between">
                          <span className={`font-medium ${l.amount > 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                            {l.amount > 0 ? "+" : ""}${Math.abs(l.amount).toFixed(2)}
                          </span>
                          <span className="text-[#8b949e]">{l.type}</span>
                        </div>
                        <div className="text-[#8b949e] text-[10px] flex justify-between">
                          <span>{l.note || "—"}</span>
                          <span>{l.created_at?.slice(0, 19).replace("T", " ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Plans */}
                {userDetailTab === "plans" && (
                  <div className="max-h-[300px] overflow-y-auto space-y-1">
                    {userPlans.length === 0 ? <p className="text-xs text-[#8b949e] text-center py-4">No plans purchased</p> :
                    userPlans.map((up) => (
                      <div key={up.id} className="bg-[#0d1117] border border-[#21262d] rounded p-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white">Plan #{up.plan_id}</span>
                          <span className={up.active ? "text-[#3fb950]" : "text-[#8b949e]"}>{up.active ? "Active" : "Expired"}</span>
                        </div>
                        <span className="text-[#8b949e] text-[10px]">Purchased: {up.purchased_at?.slice(0, 10)} · Expires: {up.expires_at?.slice(0, 10)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4 text-center text-xs text-[#8b949e]">
                Click a user to view details
              </div>
            )}

            {/* Balance form */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Balance</h2>

              {previewUser && (
                <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5 mb-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#21262d] rounded-full flex items-center justify-center text-white text-xs font-semibold">{previewUser.username[0]}</div>
                  <div className="flex-1 text-xs">
                    <p className="text-white">{previewUser.username}</p>
                    <p className="text-[#8b949e]">Balance: <span className="text-white">${(previewUser.balance || 0).toFixed(2)}</span></p>
                  </div>
                  {Number(bAmount) > 0 && (
                    <div className="text-xs text-right">
                      <span className="text-[#8b949e]">After: </span>
                      <span className="font-semibold" style={{ color: aColor }}>
                        ${(bAction === "add" ? (previewUser.balance || 0) + Number(bAmount) :
                           bAction === "remove" ? Math.max(0, (previewUser.balance || 0) - Number(bAmount)) :
                           Number(bAmount)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleBalance} className="space-y-2">
                <div className="flex gap-2">
                  <input type="number" placeholder="User ID" value={bUserId} onChange={(e) => setBUserId(e.target.value)}
                    className="w-20 h-8 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" required />
                  <input type="number" step="0.01" placeholder="Amount" value={bAmount} onChange={(e) => setBAmount(e.target.value)}
                    className="flex-1 h-8 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" required />
                </div>
                <input type="text" placeholder="Note (optional)" value={bNote} onChange={(e) => setBNote(e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]" />
                <div className="flex gap-1">
                  {(["add", "remove", "set"] as const).map((a) => (
                    <button key={a} type="button" onClick={() => setBAction(a)}
                      className={`flex-1 h-7 text-xs rounded transition-colors ${bAction === a ? "text-white font-medium" : "text-[#8b949e] bg-[#21262d]"}`}
                      style={bAction === a ? { backgroundColor: a === "add" ? "#238636" : a === "remove" ? "#f85149" : "#d29922" } : {}}>
                      {a === "add" ? "+" : a === "remove" ? "−" : "="} {a}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={bLoading}
                  className="w-full h-8 text-xs text-white rounded font-medium disabled:opacity-50" style={{ backgroundColor: aColor }}>
                  {bLoading ? "..." : `${aLabel} Balance`}
                </button>
              </form>
              {bMsg && <p className={`text-xs mt-1 ${bMsg.includes("Added") || bMsg.includes("Removed") || bMsg.includes("Set") ? "text-[#3fb950]" : "text-[#f85149]"}`}>{bMsg}</p>}
            </div>
          </div>
        </div>
      )}

      {/* === ORDERS === */}
      {tab === "Orders" && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#30363d] text-left">
                <th className="px-4 py-3 text-xs text-[#8b949e]">ID</th>
                <th className="px-4 py-3 text-xs text-[#8b949e]">Buyer</th>
                <th className="px-4 py-3 text-xs text-[#8b949e]">Item</th>
                <th className="px-4 py-3 text-xs text-[#8b949e]">Price</th>
                <th className="px-4 py-3 text-xs text-[#8b949e]">Date</th>
              </tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#21262d] hover:bg-[#21262d]/50">
                    <td className="px-4 py-3 text-[#8b949e]">{o.id}</td>
                    <td className="px-4 py-3 text-white">{o.buyer_username || `User #${o.user_id}`}</td>
                    <td className="px-4 py-3 text-[#c9d1d9]">{o.title || `Item #${o.item_id}`}</td>
                    <td className="px-4 py-3 text-white font-medium">{o.currency || "$"}{Number(o.price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#8b949e]">{o.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === SETTINGS === */}
      {tab === "Settings" && (
        <div className="max-w-[600px] space-y-4">
          {/* Pricing */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Pricing</h2>
            <label className="text-xs text-[#8b949e] block mb-1">Price Markup</label>
            <div className="flex items-center gap-2 mb-1">
              <input type="number" step="0.1" min="0.1" value={markup} onChange={(e) => setMarkup(Number(e.target.value))}
                className="w-24 h-9 px-3 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" />
              <span className="text-xs text-[#8b949e]">x multiplier</span>
            </div>
            <button onClick={async () => {
              const r = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markup }) });
              const d = await r.json();
              if (r.ok) { setMarkupMsg(`Updated to ${d.settings.markup}x`); setTimeout(() => setMarkupMsg(""), 2000); }
              else setMarkupMsg("Error");
            }} className="h-8 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-sm rounded-lg transition-colors">Save</button>
            {markupMsg && <p className="text-xs text-[#3fb950] mt-1">{markupMsg}</p>}
          </div>

          {/* Plans */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Subscription Plans</h2>
            <div className="space-y-2">
              {plansData.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-xs bg-[#0d1117] border border-[#21262d] rounded-lg p-2">
                  <span className="text-white font-medium w-20">{p.name}</span>
                  <span className="text-[#8b949e]">${p.price}</span>
                  <span className="text-[#3fb950]">{p.discount_percent}% off</span>
                  <span className="text-[#8b949e]">{p.duration_days}d</span>
                  <span className="text-[#8b949e] flex-1 truncate">{p.description}</span>
                </div>
              ))}
              {(!plansData || plansData.length === 0) && <p className="text-xs text-[#8b949e]">No plans created</p>}
            </div>
          </div>
        </div>
      )}

      {/* === LOGS === */}
      {tab === "Logs" && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <p className="text-xs text-[#8b949e] text-center py-8">Transaction logs appear here. Coming soon with full audit trail.</p>
        </div>
      )}
    </div>
  );
}
