import { NextRequest, NextResponse } from "next/server";

const FN_API = "https://fortnite-api.com/v2/cosmetics/br?language=en";
const VAL_AGENTS_API = "https://valorant-api.com/v1/agents";
const VAL_SKINS_API = "https://valorant-api.com/v1/weapons/skins";

const TYPE_MAP: Record<string, string> = {
  skins: "outfit", pickaxes: "pickaxe", dances: "emote",
  gliders: "glider", backblings: "backpack",
};

interface Cosmetic {
  id: string; name: string; description: string;
  type: { value: string }; rarity: { value: string };
  images: { smallIcon?: string; icon?: string };
}

let fnCache: Cosmetic[] | null = null;
let valAgents: { uuid: string; name: string; icon: string }[] | null = null;
let valSkins: { uuid: string; name: string; icon: string }[] | null = null;
let lastFetch = 0;
const TTL = 600_000;

async function getFortniteCosmetics(): Promise<Cosmetic[]> {
  if (fnCache && Date.now() - lastFetch < TTL) return fnCache;
  try {
    const res = await fetch(FN_API, { cache: "no-store" });
    const json = await res.json();
    const data = (json.data as Cosmetic[]) || [];
    if (data.length > 0) { fnCache = data; lastFetch = Date.now(); }
  } catch { /* */ }
  return fnCache || [];
}

async function getValAgents() {
  if (valAgents && Date.now() - lastFetch < TTL) return valAgents;
  try {
    const res = await fetch(VAL_AGENTS_API, { cache: "no-store" });
    const json = await res.json();
    const data = (json.data as Record<string, unknown>[]) || [];
    const playable = data.filter((a: Record<string, unknown>) => a.isPlayableCharacter === true);
    valAgents = playable.map((a: Record<string, unknown>) => ({
      uuid: a.uuid as string, name: a.displayName as string,
      icon: a.displayIcon as string || a.fullPortrait as string || "",
    }));
  } catch { /* */ }
  return valAgents || [];
}

async function getValSkins() {
  if (valSkins && Date.now() - lastFetch < TTL) return valSkins;
  try {
    const res = await fetch(VAL_SKINS_API, { cache: "no-store" });
    const json = await res.json();
    const data = (json.data as Record<string, unknown>[]) || [];
    valSkins = data.map((s: Record<string, unknown>) => ({
      uuid: s.uuid as string, name: s.displayName as string,
      icon: (s.displayIcon as string) || "",
    }));
  } catch { /* */ }
  return valSkins || [];
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").toLowerCase();
  const type = request.nextUrl.searchParams.get("type") || "skins";

  if (!q || q.length < 2) return NextResponse.json({ items: [] });

  if (type === "agents") {
    const all = await getValAgents();
    const items = all.filter((a) => a.name.toLowerCase().includes(q)).map((a) => ({ id: a.uuid, name: a.name, description: "Valorant Agent", rarity: "", icon: a.icon, type: "agent" }));
    return NextResponse.json({ items });
  }

  if (type === "weaponSkins") {
    const all = await getValSkins();
    const items = all.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 30).map((s) => ({ id: s.uuid, name: s.name, description: "Valorant Weapon Skin", rarity: "", icon: s.icon, type: "weaponSkin" }));
    return NextResponse.json({ items });
  }

  const fnType = TYPE_MAP[type];
  if (fnType) {
    const all = await getFortniteCosmetics();
    const items = all.filter((c) => c.type?.value === fnType && c.name?.toLowerCase().includes(q)).slice(0, 30).map((c) => ({
      id: c.id, name: c.name, description: c.description || "",
      rarity: c.rarity?.value || "", icon: c.images?.smallIcon || c.images?.icon || "", type: c.type?.value || "",
    }));
    return NextResponse.json({ items });
  }

  return NextResponse.json({ items: [] });
}
