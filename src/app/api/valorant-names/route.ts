import { NextRequest, NextResponse } from "next/server";

const AGENTS_API = "https://valorant-api.com/v1/agents";
const SKINS_API = "https://valorant-api.com/v1/weapons/skins";

let agentsCache: Record<string, string> = {};
let skinsCache: Record<string, string> = {};
let lastFetch = 0;
const TTL = 600_000;

async function load() {
  if (Date.now() - lastFetch < TTL && Object.keys(agentsCache).length > 0) return;

  try {
    const [aRes, sRes] = await Promise.all([
      fetch(AGENTS_API, { cache: "no-store" }).then((r) => r.json()),
      fetch(SKINS_API, { cache: "no-store" }).then((r) => r.json()),
    ]);

    const agents = (aRes.data as Record<string, unknown>[]) || [];
    for (const a of agents) {
      if (a.isPlayableCharacter) {
        agentsCache[a.uuid as string] = a.displayName as string;
      }
    }

    const skins = (sRes.data as Record<string, unknown>[]) || [];
    for (const s of skins) {
      skinsCache[s.uuid as string] = s.displayName as string;
    }

    lastFetch = Date.now();
  } catch { /* */ }
}

export async function GET(request: NextRequest) {
  try {
    await load();
    const type = request.nextUrl.searchParams.get("type") || "agents";
    const uuids = (request.nextUrl.searchParams.get("uuids") || "").split(",").filter(Boolean);

    if (type === "agents") {
      const map: Record<string, string> = {};
      for (const uuid of uuids) {
        if (agentsCache[uuid]) map[uuid] = agentsCache[uuid];
      }
      return NextResponse.json({ names: map });
    }

    if (type === "skins") {
      const map: Record<string, string> = {};
      for (const uuid of uuids) {
        if (skinsCache[uuid]) map[uuid] = skinsCache[uuid];
      }
      return NextResponse.json({ names: map });
    }

    return NextResponse.json({ names: {} });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
