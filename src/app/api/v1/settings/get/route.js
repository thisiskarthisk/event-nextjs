import { DB_Fetch, Tables } from "@/db";
import { sql } from "drizzle-orm";
import { JsonResponse } from "@/helper/api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group");

    if (!group) {
      return JsonResponse.error("group is required", 422);
    }

    const rows = await DB_Fetch(sql`
      -- 🐛 CORRECTION: Use 'field_name' instead of 'setting_key' 
      SELECT field_name, value 
      FROM ${sql.identifier(Tables.TBL_SETTINGS)}
      WHERE setting_group = ${group}
    `);

    const result = {};
    rows.forEach(r => {
      // 🐛 CORRECTION: Use 'field_name' here to construct the response object keys
      result[r.field_name] = r.value;
    });

    // The response object keys will now match what the frontend expects: 
    // { employee_id: "...", rca_id: "...", ... }
    return JsonResponse.success(result); 

  } catch (err) {
    console.error("[settings/get] error:", err);
    return JsonResponse.error("Unable to fetch settings", 500);
  }
}
