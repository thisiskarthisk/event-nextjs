import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await DB_Fetch(sql`
      SELECT field_name, value
      FROM ${sql.identifier(Tables.TBL_SETTINGS)}
      WHERE setting_group = 'chart'
    `);

    const settings = {};
    rows.forEach(r => {
      settings[r.field_name] = r.value;
    });

    return JsonResponse.success({
      ucl_colour: settings.ucl_colour || "#ff0000", // ✅ fallback
      lcl_colour: settings.lcl_colour || "#0000ff",
      ucl_style: Number(settings.ucl_style ?? 0),
      lcl_style: Number(settings.lcl_style ?? 0)
    });

  } catch (err) {
    console.error("[chart-styles]", err);
    return JsonResponse.error("Failed to load chart settings", 500);
  }
}
