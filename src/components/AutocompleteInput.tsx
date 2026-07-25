"use client";

import { useState, useRef, useEffect } from "react";

interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  rarity: string;
  icon: string;
  type: string;
}

interface Props {
  label: string;
  placeholder: string;
  apiType: string;
  selected: string;
  onChange: (v: string) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "#b0b0b0", uncommon: "#5eccab", rare: "#4b9cff",
  epic: "#b45cff", legendary: "#ffb800",
};

// Convert fortnite-api.com ID to LZT format
// Skins: strip CID_ prefix. Emotes: strip EID_ prefix.
// Pickaxes/Gliders/Backblings: keep prefix, just lowercase.
function toLztId(id: string, apiType: string): string {
  if (apiType === "agents" || apiType === "weaponSkins" || apiType === "buddies") return id;
  let s = id;
  if (apiType === "skins") {
    if (s.startsWith("CID_")) s = s.slice(4);
  } else if (apiType === "dances") {
    if (s.startsWith("EID_")) s = s.slice(4);
  }
  // Pickaxes, Gliders, Backblings: keep original prefix, just lowercase
  return s.toLowerCase();
}

export default function AutocompleteInput({ label, placeholder, apiType, selected, onChange }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(-1);
  const [results, setResults] = useState<CosmeticItem[]>([]);
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Preload on first focus
  const preload = async () => {
    if (ready) return;
    try {
      await fetch(`/api/fortnite-search?q=aa&type=${apiType}`);
    } catch { /* */ }
    setReady(true);
  };

  // Parse selected: "name||id,name2||id2" or just "id,id2" (legacy)
  const selectedItems = selected ? selected.split(",").filter(Boolean).map((s) => {
    const parts = s.split("||");
    const name = parts[0] || s;
    const id = parts[1] || s;
    return { name, id };
  }) : [];

  useEffect(() => {
    clearTimeout(timer.current);
    if (!input.trim() || input.length < 2) { setResults([]); setOpen(false); return; }

    if (!ready) preload();
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/fortnite-search?q=${encodeURIComponent(input)}&type=${apiType}`);
        const d = await r.json();
        setResults(d.items || []);
        setOpen((d.items || []).length > 0);
      } catch { setResults([]); setOpen(false); }
    }, 150);
  }, [input, apiType, ready]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const remove = (id: string) => {
    onChange(selectedItems.filter((i) => i.id !== id).map((i) => `${i.name}||${i.id}`).join(","));
  };

  const add = (item: CosmeticItem) => {
    const lztId = toLztId(item.id, apiType);
    const key = `${item.name}||${lztId}`;
    if (!selectedItems.some((i) => i.id === lztId)) {
      onChange(selectedItems.length > 0 ? `${selected},${key}` : key);
    }
    setInput("");
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-xs text-[#8b949e]">{label}</label>
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 mb-1">
          {selectedItems.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-[#1f6feb]/20 border border-[#1f6feb]/30 rounded max-w-full">
              <span className="truncate max-w-[160px]">{item.name}</span>
              <button type="button" onClick={() => remove(item.id)} className="text-[#8b949e] hover:text-white shrink-0 ml-1">&times;</button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text" placeholder={placeholder} value={input}
        onChange={(e) => { setInput(e.target.value); setHl(-1); }}
        onFocus={() => { preload(); if (results.length > 0) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setHl((h) => Math.min(h + 1, results.length - 1)); setOpen(true); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
          if (e.key === "Enter" && hl >= 0) { e.preventDefault(); add(results[hl]); }
        }}
        className="w-full h-8 px-2 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-[#161b22] border border-[#30363d] rounded shadow-lg">
          {results.map((item, i) => (
            <button key={item.id} type="button"
              className={`w-full text-left px-2 py-1.5 text-xs text-[#c9d1d9] hover:bg-[#21262d] flex items-center gap-2 border-b border-[#21262d] last:border-0 ${i === hl ? "bg-[#21262d]" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); add(item); }}
              onMouseEnter={() => setHl(i)}
            >
              {item.icon && (
                <img src={item.icon} alt="" className="w-8 h-8 rounded object-contain shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="flex-1 min-w-0">
                <span className="truncate font-medium text-[#c9d1d9]">{item.name}</span>
                {item.rarity && <span className="w-2 h-2 rounded-full inline-block ml-1 align-middle" style={{ backgroundColor: RARITY_COLORS[item.rarity] || "#b0b0b0" }} />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
