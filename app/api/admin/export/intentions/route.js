import { dbSelect } from "@/lib/server/db";
import { isAuthorizedRequest } from "@/lib/server/adminAuth";
import { currentSeasonYear } from "@/lib/data";

export const dynamic = "force-dynamic";

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET ?format=csv&season_year= — export raw planting intentions. */
export async function GET(request) {
  if (!isAuthorizedRequest(request)) {
    return new Response("unauthorized", { status: 401 });
  }
  const seasonYear =
    Number(new URL(request.url).searchParams.get("season_year")) || currentSeasonYear();

  let rows = [];
  try {
    rows = await dbSelect("planting_intentions", { season_year: seasonYear });
  } catch {
    rows = [];
  }

  const header = ["season_year", "district", "crop", "hectares", "planting_month", "market_target", "farmer_name", "phone", "created_at"];
  const lines = [
    header.join(","),
    ...rows.map((r) => header.map((h) => csvEscape(r[h])).join(",")),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="agrimart_intentions_${seasonYear}.csv"`,
    },
  });
}
