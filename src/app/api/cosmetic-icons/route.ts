import { NextRequest, NextResponse } from "next/server";

const FN_API = "https://fortnite-api.com/v2/cosmetics/br?language=en";

interface Cosmetic {
  id: string;
  name: string;
  type: { value: string };
  rarity: { value: string };
  images: { smallIcon?: string; icon?: string };
}

let allCache: Cosmetic[] | null = null;
let lastFetch = 0;
const TTL = 600_000;

async function getAll(): Promise<Cosmetic[]> {
  if (allCache && Date.now() - lastFetch < TTL) return allCache;
  try {
    const res = await fetch(FN_API, { cache: "no-store" });
    const json = await res.json();
    const data = (json.data as Cosmetic[]) || [];
    if (data.length > 0) { allCache = data; lastFetch = Date.now(); }
  } catch { /* */ }
  return allCache || [];
}

let lookupMap: Map<string, Cosmetic> | null = null;

function buildLookup(all: Cosmetic[]): Map<string, Cosmetic> {
  if (lookupMap) return lookupMap;
  lookupMap = new Map();
  for (const c of all) {
    const lower = c.id.toLowerCase();
    lookupMap.set(lower, c);
    let stripped = lower;
    for (const p of ["cid_", "eid_", "glider_", "pickaxe_", "character_", "umbrella_", "backpack_", "solo_", "founder", "athena_", "commando_", "default"]) {
      if (stripped.startsWith(p)) { stripped = stripped.slice(p.length); break; }
    }
    lookupMap.set(stripped, c);
    const parts = lower.split("_");
    if (parts.length > 2) {
      lookupMap.set(parts.slice(2).join("_"), c);
    }
  }
  return lookupMap;
}

export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids") || "";
    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ icons: {} });

    const all = await getAll();
    const map = buildLookup(all);
    const icons: Record<string, { icon: string; rarity: string; name: string }> = {};

    for (const lztId of ids) {
      const key = lztId.toLowerCase();
      let match = map.get(key);
      if (!match) match = map.get(key.replace(/^cid_/i, ""));
      if (!match) match = map.get(key.replace(/^eid_/i, ""));
      if (!match) match = map.get(`cid_${key}`);
      if (!match) {
        const parts = key.split("_");
        if (parts.length > 2) match = map.get(parts.slice(2).join("_"));
      }
      icons[lztId] = {
        icon: match?.images?.smallIcon || match?.images?.icon || "",
        rarity: match?.rarity?.value || "",
        name: match?.name || lztId,
      };
    }

    return NextResponse.json({ icons });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
