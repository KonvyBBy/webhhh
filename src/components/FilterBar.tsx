"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import AutocompleteInput from "./AutocompleteInput";

const VALORANT_RANKS = ["Iron 1","Iron 2","Iron 3","Bronze 1","Bronze 2","Bronze 3","Silver 1","Silver 2","Silver 3","Gold 1","Gold 2","Gold 3","Platinum 1","Platinum 2","Platinum 3","Diamond 1","Diamond 2","Diamond 3","Ascendant 1","Ascendant 2","Ascendant 3","Immortal 1","Immortal 2","Immortal 3","Radiant"];

function FilterBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isFortnite = pathname === "/fortnite";
  const isValorant = pathname === "/riot";

  const get = (k: string) => searchParams.get(k) || "";

  const [title, setTitle] = useState(get("title"));
  const [pmin, setPmin] = useState(get("pmin"));
  const [pmax, setPmax] = useState(get("pmax"));
  const [skinInput, setSkinInput] = useState(searchParams.getAll("skin[]").join(","));
  const [pickaxeInput, setPickaxeInput] = useState(searchParams.getAll("pickaxe[]").join(","));
  const [danceInput, setDanceInput] = useState(searchParams.getAll("dance[]").join(","));
  const [gliderInput, setGliderInput] = useState(searchParams.getAll("glider[]").join(","));
  const [weaponSkinInput, setWeaponSkinInput] = useState("");
  const [agentInput, setAgentInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [section, setSection] = useState<string | null>(null);

  const [smin, setSmin] = useState(get("smin"));
  const [vbmin, setVbmin] = useState(get("vbmin"));
  const [lmin, setLmin] = useState(get("lmin"));
  const [daybreak, setDaybreak] = useState(get("daybreak"));

  const [rmin, setRmin] = useState(get("rmin"));
  const [valLevelMin, setValLevelMin] = useState(get("valorant_level_min") || "1");
  const [valLevelMax, setValLevelMax] = useState(get("valorant_level_max"));
  const [region, setRegion] = useState(get("valorant_region"));
  const [valSmin, setValSmin] = useState(get("valorant_smin"));
  const [vpMin, setVpMin] = useState(get("vp_min"));
  const [vpMax, setVpMax] = useState(get("vp_max"));

  useEffect(() => {
    setTitle(get("title")); setPmin(get("pmin")); setPmax(get("pmax"));
    setSmin(get("smin"));
    setVbmin(get("vbmin")); setLmin(get("lmin"));
    setDaybreak(get("daybreak"));
    setRmin(get("rmin"));
    setValLevelMin(get("valorant_level_min") || "1"); setValLevelMax(get("valorant_level_max"));
    setRegion(get("valorant_region"));
    setValSmin(get("valorant_smin"));
    setVpMin(get("vp_min")); setVpMax(get("vp_max"));
  }, [searchParams]);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (title.trim()) params.set("title", title.trim());
    if (pmin) params.set("pmin", pmin);
    if (pmax) params.set("pmax", pmax);
    params.set("order_by", "price_to_up");

    // Cosmetic filters (name||id format, extract the ID)
    const extractIds = (val: string) => val.split(",").filter(Boolean).map((s) => {
      const p = s.trim().split("||");
      return (p[1] || p[0]).trim();
    }).filter(Boolean);
    extractIds(skinInput).forEach((id) => params.append("skin[]", id));
    extractIds(pickaxeInput).forEach((id) => params.append("pickaxe[]", id));
    extractIds(danceInput).forEach((id) => params.append("dance[]", id));
    extractIds(gliderInput).forEach((id) => params.append("glider[]", id));
    extractIds(weaponSkinInput).forEach((id) => params.append("weaponSkin[]", id));
    extractIds(agentInput).forEach((id) => params.append("agent[]", id));

    if (isFortnite) {
      if (smin) params.set("smin", smin);
      if (vbmin) params.set("vbmin", vbmin);
      if (lmin) params.set("lmin", lmin);
      if (daybreak) params.set("daybreak", daybreak);
    }
    if (isValorant) {
      if (rmin) params.set("rmin", rmin);
      if (valLevelMin && valLevelMin !== "1") params.set("valorant_level_min", valLevelMin);
      if (valLevelMax) params.set("valorant_level_max", valLevelMax);
      if (region) params.set("valorant_region[]", region);
      if (valSmin) params.set("valorant_smin", valSmin);
      if (vpMin) params.set("vp_min", vpMin); if (vpMax) params.set("vp_max", vpMax);
    }
    return params;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const params = buildParams();

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearFilters = () => {
    setTitle(""); setPmin(""); setPmax("");
    setSkinInput(""); setPickaxeInput(""); setDanceInput(""); setGliderInput("");
    setWeaponSkinInput(""); setAgentInput("");
    setSmin(""); setVbmin(""); setLmin(""); setDaybreak("");
    setRmin(""); setValLevelMin("1"); setValLevelMax("");
    setRegion(""); setValSmin(""); setVpMin(""); setVpMax("");
    router.push(pathname);
  };

  const hasFilters = title || pmin || pmax;
  const toggle = (s: string) => setSection(section === s ? null : s);

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
            <input type="text" placeholder="Search by title..." value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]" />
          </div>
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 rounded-lg text-sm border transition-colors flex items-center gap-1.5 shrink-0 ${showFilters || hasFilters ? "bg-[#58a6ff]/10 border-[#58a6ff] text-[#58a6ff]" : "bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#58a6ff]"}`}>
            <SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline">Filters</span>
          </button>
          <button type="submit" className="h-9 px-5 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-lg transition-colors shrink-0">Search
          </button>
          {hasFilters && <button type="button" onClick={clearFilters} className="h-9 px-3 text-[#8b949e] hover:text-[#f85149] transition-colors shrink-0"><X className="w-4 h-4" /></button>}
        </div>

        <div className="flex flex-wrap gap-2 text-xs items-end">
          <div><label className="text-[#8b949e]">Price</label>
            <div className="flex items-center gap-1 mt-0.5">
              <input type="number" placeholder="$0" value={pmin} onChange={(e) => setPmin(e.target.value)} className="w-20 h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" step="0.01" />
              <span className="text-[#8b949e]">-</span>
              <input type="number" placeholder="$999" value={pmax} onChange={(e) => setPmax(e.target.value)} className="w-20 h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" step="0.01" />
            </div>
          </div>
          <span className="text-[#8b949e] text-xs pb-1">Sorted: Cheapest first</span>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-[#21262d] space-y-1">
            {isFortnite && (
              <>
                <button type="button" onClick={() => toggle("fnCosmetic")} className="flex items-center gap-1 text-xs text-[#c9d1d9] hover:text-white py-2 w-full text-left">
                  {section === "fnCosmetic" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span className="font-medium">Search Cosmetics</span>
                </button>
                {section === "fnCosmetic" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 pl-4">
                    <AutocompleteInput label="Skins" placeholder="Search skins..." apiType="skins" selected={skinInput} onChange={setSkinInput} />
                    <AutocompleteInput label="Pickaxes" placeholder="Search pickaxes..." apiType="pickaxes" selected={pickaxeInput} onChange={setPickaxeInput} />
                    <AutocompleteInput label="Emotes" placeholder="Search emotes..." apiType="dances" selected={danceInput} onChange={setDanceInput} />
                    <AutocompleteInput label="Gliders" placeholder="Search gliders..." apiType="gliders" selected={gliderInput} onChange={setGliderInput} />
                  </div>
                )}

                <button type="button" onClick={() => toggle("fnCounts")} className="flex items-center gap-1 text-xs text-[#c9d1d9] hover:text-white py-2 w-full text-left">
                  {section === "fnCounts" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span className="font-medium">Account Details</span>
                </button>
                {section === "fnCounts" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 pl-4">
                    <div><label className="text-xs text-[#8b949e]">Min Skins</label>
                      <input type="number" placeholder="0" value={smin} onChange={(e) => setSmin(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" />
                    </div>
                    <div><label className="text-xs text-[#8b949e]">Min Level</label>
                      <input type="number" placeholder="0" value={lmin} onChange={(e) => setLmin(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" />
                    </div>
                    <div><label className="text-xs text-[#8b949e]">Min V-Bucks</label>
                      <input type="number" placeholder="0" value={vbmin} onChange={(e) => setVbmin(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" />
                    </div>
                    <div><label className="text-xs text-[#8b949e]">Last Activity (days)</label>
                      <input type="number" placeholder="e.g. 30" value={daybreak} onChange={(e) => setDaybreak(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" />
                    </div>
                  </div>
                )}
              </>
            )}

            {isValorant && (
              <>
                <button type="button" onClick={() => toggle("valSearch")} className="flex items-center gap-1 text-xs text-[#c9d1d9] hover:text-white py-2 w-full text-left">
                  {section === "valSearch" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span className="font-medium">Search Weapon Skins</span>
                </button>
                {section === "valSearch" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 pl-4">
                    <AutocompleteInput label="Weapon Skins" placeholder="Search weapon skins..." apiType="weaponSkins" selected={weaponSkinInput} onChange={setWeaponSkinInput} />
                  </div>
                )}
                <button type="button" onClick={() => toggle("valRank")} className="flex items-center gap-1 text-xs text-[#c9d1d9] hover:text-white py-2 w-full text-left">
                  {section === "valRank" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span className="font-medium">Rank, Region &amp; Level</span>
                </button>
                {section === "valRank" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 pl-4">
                    <div><label className="text-xs text-[#8b949e]">Min Rank</label>
                      <select value={rmin} onChange={(e) => setRmin(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]">
                        <option value="">Any</option>
                        {VALORANT_RANKS.map((r, i) => <option key={r} value={i+3}>{r}</option>)}
                      </select>
                    </div>

                    <div><label className="text-xs text-[#8b949e]">Level</label>
                      <div className="flex items-center gap-1">
                        <input type="number" placeholder="0" value={valLevelMin} onChange={(e) => setValLevelMin(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" />
                        <span className="text-[#8b949e]">-</span>
                        <input type="number" placeholder="999" value={valLevelMax} onChange={(e) => setValLevelMax(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" />
                      </div>
                    </div>
                    <div><label className="text-xs text-[#8b949e]">Region</label>
                      <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]">
                        <option value="">Any</option>
                        <option value="NA">North America</option><option value="EU">Europe</option>
                        <option value="AP">Asia-Pacific</option><option value="KR">Korea</option>
                        <option value="LATAM">Latin America</option><option value="BR">Brazil</option>
                      </select>
                    </div>
                  </div>
                )}
                <button type="button" onClick={() => toggle("valItems")} className="flex items-center gap-1 text-xs text-[#c9d1d9] hover:text-white py-2 w-full text-left">
                  {section === "valItems" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span className="font-medium">Item Counts &amp; Wallet</span>
                </button>
                {section === "valItems" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 pl-4">
                    <div><label className="text-xs text-[#8b949e]">Min Skins</label>
                      <input type="number" placeholder="0" value={valSmin} onChange={(e) => setValSmin(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" />
                    </div>
                    <div><label className="text-xs text-[#8b949e]">VP (min)</label>
                      <input type="number" placeholder="0" value={vpMin} onChange={(e) => setVpMin(e.target.value)} className="w-full h-7 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" min="0" />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="pt-2 flex gap-2">
              <button type="submit" className="h-8 px-5 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium rounded-lg transition-colors">Apply Filters
              </button>
              {hasFilters && <button type="button" onClick={clearFilters} className="h-8 px-4 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-sm rounded-lg transition-colors">Clear All</button>}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

export default function FilterBar() {
  return <Suspense fallback={<div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-4 h-9" />}><FilterBarInner /></Suspense>;
}
