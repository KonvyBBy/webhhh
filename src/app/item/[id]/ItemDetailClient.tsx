"use client";

import { useState, useEffect } from "react";
import { Shield, Wallet, Search, Copy } from "lucide-react";

interface ItemDetailClientProps {
  item: Record<string, unknown>;
  itemId: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#b0b0b0", uncommon: "#5eccab", rare: "#4b9cff",
  epic: "#b45cff", legendary: "#ffb800", marvel: "#ef4036",
  dc: "#0476f2", icon: "#00e5ff", gaminglegends: "#00e5ff",
};

const TYPE_LABELS: Record<string, string> = {
  outfit: "Skins", pickaxe: "Pickaxes", dance: "Emotes",
  glider: "Gliders", backpack: "Backblings", emote: "Emotes",
};

function formatPrice(item: Record<string, unknown>): string {
  const price = item.price;
  const currency = item.currency as Record<string, string> | undefined;
  const symbol = currency?.symbol || "$";
  if (typeof price === "number") return `${symbol}${price.toFixed(2)}`;
  return `${symbol}0.00`;
}

export default function ItemDetailClient({ item, itemId }: ItemDetailClientProps) {
  const title = (item.title as string) || `Item #${itemId}`;
  const description = item.description as string;
  const guarantee = item.guarantee as string;
  const origin = item.item_origin as string;
  const country = item.country as string;
  const views = (item.view_count as number) || 0;
  const user = item.user as Record<string, unknown> | undefined;
  const username = (user?.username as string) || "Unknown";
  const userId = (user?.user_id as number) || 0;
  const images = item.images as Record<string, unknown>[] | undefined;
  const price = Number(item.price) || 0;
  const skinsAll = (item.fortniteSkins as Record<string, unknown>[]) || [];
  const pickaxesAll = ((item.fortnitePickaxe as Record<string, unknown>[]) || []).map((s) => ({ ...s, type: "pickaxe" }));
  const dancesAll = ((item.fortniteDance as Record<string, unknown>[]) || []).map((s) => ({ ...s, type: "dance" }));
  const glidersAll = ((item.fortniteGliders as Record<string, unknown>[]) || []).map((s) => ({ ...s, type: "glider" }));
  const fortniteSkins: Record<string, unknown>[] = [...skinsAll, ...pickaxesAll, ...dancesAll, ...glidersAll];
  const steamData = item.steam_data as Record<string, unknown> | null;
  const isRiot = item.riot_valorant_level !== undefined;
  const riotLevel = item.riot_valorant_level as number;
  const riotRank = item.valorantRankTitle as string;
  const riotRegion = item.valorantRegionPhrase as string;
  const riotSkinCount = item.riot_valorant_skin_count as number;
  const riotAgentCount = item.riot_valorant_agent_count as number;
  const riotKnifeCount = item.riot_valorant_knife_count as number;
  const riotVp = item.riot_valorant_wallet_vp as number;
  const riotRp = item.riot_valorant_wallet_rp as number;
  const valorantInv = item.valorantInventory as Record<string, unknown> | undefined;

  const [authUser, setAuthUser] = useState<{ balance: number } | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyResult, setBuyResult] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [skinSearch, setSkinSearch] = useState("");
  const [skinTab, setSkinTab] = useState("outfit");
  const [visibleCount, setVisibleCount] = useState(30);

  const [riotAgentNames, setRiotAgentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => { if (data.user) setAuthUser(data.user); })
      .catch(() => {});
  }, []);

  // Fetch Valorant agent names
  useEffect(() => {
    if (!valorantInv) return;
    const agentUuids = (valorantInv?.["Agent"] as string[]) || [];
    if (agentUuids.length === 0) return;
    fetch(`/api/valorant-names?type=agents&uuids=${agentUuids.join(",")}`)
      .then((r) => r.json())
      .then((data) => { if (data.names) setRiotAgentNames(data.names); })
      .catch(() => {});
  }, [valorantInv]);

  // Group cosmetics by type and filter by search
  const groupedSkins: Record<string, { id: string; name: string; rarity: string }[]> = {};
  const searchLower = skinSearch.toLowerCase();

  if (fortniteSkins) {
    for (const s of fortniteSkins) {
      const type = (s.type as string) || "outfit";
      const id = s.id as string;
      const name = s.title as string;
      const rarity = (s.rarity as string) || "common";
      if (!groupedSkins[type]) groupedSkins[type] = [];
      if (!searchLower || name.toLowerCase().includes(searchLower)) {
        groupedSkins[type].push({ id, name, rarity });
      }
    }
  }

  const typesWithItems = Object.entries(groupedSkins).filter(([, items]) => items.length > 0);
  const totalCosmetics = fortniteSkins?.length || 0;

  const handleBuy = async () => {
    setBuying(true);
    setBuyError(null);
    setBuyResult(null);
    try {
      if (!authUser) { setBuyError("Please login to purchase"); setBuying(false); return; }
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: Number(itemId) }),
      });
      const data = await res.json();
      if (!res.ok) { setBuyError(data.error || "Purchase failed"); }
      else { setBuyResult(JSON.stringify(data.credentials, null, 2)); setAuthUser((prev) => prev ? { ...prev, balance: data.balance } : prev); }
    } catch (err) { setBuyError(String(err)); }
    setBuying(false);
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 py-6">
      {/* Main info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {images && images.length > 0 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
            <img src={images[0].url as string || images[0].thumb_url as string} alt={title} className="w-full aspect-square object-cover" />
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto border-t border-[#21262d]">
                {images.map((img, i) => (
                  <img key={i} src={img.url as string || img.thumb_url as string} alt="" className="w-16 h-16 rounded border border-[#30363d] object-cover shrink-0" />
                ))}
              </div>
            )}
          </div>
          )}

          {/* Valorant Inventory */}
          {isRiot && (
            <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Valorant Inventory</h2>
              <div className="space-y-2">
                {riotLevel !== undefined && <div className="flex items-center gap-2 text-xs"><span className="text-[#8b949e] w-24">Level</span><span className="text-white">{riotLevel}</span></div>}
                {riotRank && <div className="flex items-center gap-2 text-xs"><span className="text-[#8b949e] w-24">Rank</span><span className="text-white">{riotRank}</span></div>}
                {riotRegion && <div className="flex items-center gap-2 text-xs"><span className="text-[#8b949e] w-24">Region</span><span className="text-white">{riotRegion}</span></div>}
                {riotSkinCount !== undefined && <div className="flex items-center gap-2 text-xs"><span className="text-[#8b949e] w-24">Skins</span><span className="text-white">{riotSkinCount}</span></div>}
                {riotAgentCount !== undefined && <div className="flex items-center gap-2 text-xs"><span className="text-[#8b949e] w-24">Agents</span><span className="text-white">{riotAgentCount}</span></div>}
                {riotKnifeCount !== undefined && <div className="flex items-center gap-2 text-xs"><span className="text-[#8b949e] w-24">Knives</span><span className="text-white">{riotKnifeCount}</span></div>}
                {riotVp !== undefined && <div className="flex items-center gap-2 text-xs"><span className="text-[#8b949e] w-24">VP</span><span className="text-white">{riotVp}</span></div>}
                {riotRp !== undefined && <div className="flex items-center gap-2 text-xs"><span className="text-[#8b949e] w-24">RP</span><span className="text-white">{riotRp}</span></div>}
              </div>

              {/* Agents */}
              {(() => { const agents = (valorantInv as Record<string, unknown>)?.["Agent"] as string[] | undefined; return agents && agents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#21262d]">
                  <h3 className="text-xs text-[#8b949e] uppercase tracking-wider mb-2 font-medium">Agents ({agents.length})</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {agents.map((uuid) => (
                      <span key={uuid} className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-[#30363d] bg-[#21262d] text-[#c9d1d9]">
                        {riotAgentNames[uuid] || uuid.slice(0, 8) + "..."}
                      </span>
                    ))}
                  </div>
                </div>
              )})()}
            </div>
          )}

          {/* Skin Check Section */}
          {totalCosmetics > 0 && (
            <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Skin Check ({totalCosmetics} items)</h2>
                <span className="text-[10px] text-[#58a6ff] font-medium tracking-wider">KONVY ACCOUNTS</span>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
                <input type="text" placeholder="Search items..." value={skinSearch}
                  onChange={(e) => setSkinSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]" />
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-none">
                {typesWithItems.map(([type, items]) => (
                  <button key={type} onClick={() => setSkinTab(type)}
                    className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${skinTab === type ? "bg-[#58a6ff] text-white" : "bg-[#21262d] text-[#8b949e] hover:text-white"}`}>
                    {TYPE_LABELS[type] || type} ({items.length})
                  </button>
                ))}
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto skin-scroll">
                {typesWithItems.filter(([t]) => t === skinTab).map(([type, items]) => {
                  const shown = items.slice(0, visibleCount);
                  const total = items.length;
                  return (
                  <div key={type}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                      {shown.map((s) => {
                        const imgUrl = `https://fortnite-api.com/images/cosmetics/br/${(s.id as string).toLowerCase()}/smallicon.png`;
                        return (
                          <div key={s.id as string || s.name}
                            className="flex flex-col items-center gap-1 p-1.5 rounded border text-center"
                            style={{
                              backgroundColor: `${RARITY_COLORS[s.rarity] || "#b0b0b0"}10`,
                              borderColor: `${RARITY_COLORS[s.rarity] || "#b0b0b0"}30`,
                            }}>
                            <img src={imgUrl} alt={s.name} className="w-10 h-10 object-contain" loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            <span className="text-[10px] leading-tight truncate w-full"
                              style={{ color: RARITY_COLORS[s.rarity] || "#b0b0b0" }}>
                              {s.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {total > visibleCount && (
                      <button onClick={() => setVisibleCount((c) => c + 50)}
                        className="w-full mt-2 py-2 text-xs text-[#58a6ff] hover:bg-[#21262d] rounded transition-colors">
                        Show {Math.min(50, total - visibleCount)} more ({total - visibleCount} remaining)
                      </button>
                    )}
                  </div>
                  );
                })}
                {typesWithItems.filter(([t]) => t === skinTab).length === 0 && skinSearch && (
                  <p className="text-xs text-[#8b949e] text-center py-4">No items match &quot;{skinSearch}&quot;</p>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-[#21262d] flex items-center justify-between">
                <span className="text-[10px] text-[#58a6ff] font-medium">KONVY ACCOUNTS</span>
                <span className="text-[10px] text-[#8b949e]">discord.gg/fullaccess</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="text-3xl font-bold text-white">{formatPrice(item)}</div>

          {guarantee && (
            <div className="mt-3 flex items-center gap-2 text-sm text-[#3fb950] bg-[#3fb950]/10 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4" /><span>Guarantee: {guarantee}</span>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {authUser && (
              <div className="flex items-center gap-2 text-xs text-[#8b949e] bg-[#21262d] rounded-lg px-3 py-2">
                <Wallet className="w-4 h-4 text-[#3fb950]" />
                <span>Your balance: <span className="text-[#3fb950] font-medium">${authUser.balance.toFixed(2)}</span></span>
              </div>
            )}
            <button onClick={handleBuy} disabled={buying}
              className="w-full px-4 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {buying ? "Processing..." : "Buy Now"}
            </button>
            {buyError && <div className="bg-[#f85149]/10 border border-[#f85149]/30 rounded-lg p-3 text-sm text-[#f85149]">{buyError}</div>}
            {buyResult && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                <p className="text-xs text-[#3fb950] font-medium mb-2">Purchase successful!</p>
                {(() => {
                  try {
                    const raw = JSON.parse(buyResult);
                    const c = raw.status === "ok" && raw.item ? (() => {
                      const item = raw.item; const ld = item.loginData || {}; const ed = item.emailLoginData || {};
                      return { login: item.login || ld.login, password: ld.password, email: ed.login, emailPassword: ed.password, emailOldPassword: ed.oldPassword, emailSecretAnswer: ed.newSecretAnswer, domain: item.domain, emailLoginUrl: item.emailLoginUrl };
                    })() : raw;

                    const rows: { label: string; value: string; key: string }[] = [];
                    if (c.login) rows.push({ label: "Login", value: c.login, key: "login" });
                    if (c.password) rows.push({ label: "Password", value: c.password, key: "pass" });
                    if (rows.length > 0) {
                      return (
                        <div className="bg-[#0d1117] border border-[#21262d] rounded-lg divide-y divide-[#21262d]">
                          {rows.map((r) => (
                            <div key={r.key} className="flex items-center justify-between px-3 py-2">
                              <span className="text-[#8b949e] text-xs shrink-0 w-14">{r.label}</span>
                              <code className="text-xs text-[#c9d1d9] break-all font-mono flex-1 ml-3">{r.value}</code>
                              <button onClick={async () => { try { await navigator.clipboard.writeText(r.value); } catch { const ta = document.createElement("textarea"); ta.value = r.value; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); } }}
                                className="shrink-0 ml-2 p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return <pre className="text-xs text-[#c9d1d9]">{buyResult}</pre>;
                  } catch { return <pre className="text-xs text-[#c9d1d9]">{buyResult}</pre>; }
                })()}
              </div>
            )}
          </div>

          {steamData && Object.keys(steamData).length > 0 && (
            <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Steam Data</h2>
              <pre className="text-xs text-[#8b949e] whitespace-pre-wrap overflow-x-auto max-h-60">{JSON.stringify(steamData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
