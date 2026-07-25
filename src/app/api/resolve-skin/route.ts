import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://prod-api.lzt.market";
const API_TOKEN = process.env.LZT_API_TOKEN || "";

function strip(id: string): string {
  if (id.startsWith("cid_")) return id.slice(4);
  if (id.startsWith("eid_")) return id.slice(4);
  if (id.startsWith("glider_id_")) return id.slice(10);
  if (id.startsWith("pickaxe_")) return id;
  if (id.startsWith("character_")) return id.slice(10);
  return id;
}

const CATEGORIES = [
  { param: "skin[]", field: "fortniteSkins", label: "Skin" },
  { param: "pickaxe[]", field: "fortnitePickaxe", label: "Pickaxe" },
  { param: "dance[]", field: "fortniteDance", label: "Emote" },
  { param: "glider[]", field: "fortniteGliders", label: "Glider" },
];

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const target = query.toLowerCase().trim();

    for (let page = 1; page <= 20; page++) {
      const res = await fetch(
        `${API_BASE}/fortnite?order_by=pdate_to_down&page=${page}`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}`, Accept: "application/json" },
          cache: "no-store",
        }
      );
      if (!res.ok) break;
      const data = await res.json();
      const items = (data.items as Record<string, unknown>[]) || [];

      for (const item of items) {
        // Fetch detail to get full cosmetic lists
        const detailRes = await fetch(`${API_BASE}/${item.item_id}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}`, Accept: "application/json" },
          cache: "no-store",
        });
        if (!detailRes.ok) continue;
        const detailData = await detailRes.json();
        const detail = detailData.item as Record<string, unknown> | undefined;
        if (!detail) continue;

        for (const cat of CATEGORIES) {
          const list = detail[cat.field] as Record<string, unknown>[] | undefined;
          if (!list) continue;
          for (const cosmetic of list) {
            const title = ((cosmetic.title as string) || "").toLowerCase().trim();
            if (title === target) {
              const rawId = cosmetic.id as string;
              const queryId = strip(rawId);
              return NextResponse.json({
                found: true,
                param: cat.param,
                queryId,
                rawId,
                name: cosmetic.title as string,
                type: cat.label,
              });
            }
          }
        }
      }

      if (items.length < 40) break;
    }

    return NextResponse.json({ found: false });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
