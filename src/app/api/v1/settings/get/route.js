import { DB_Fetch, Tables } from "@/db";
import { sql } from "drizzle-orm";
import { JsonResponse } from "@/helper/api";

export async function GET(req) {

  try {

    const { searchParams } = new URL(req.url);

    const group = searchParams.get("group");

    if (!group) {
      return JsonResponse.error("group required", 422);
    }

    const rows = await DB_Fetch(sql`
      SELECT field_name, value
      FROM ${sql.identifier(Tables.TBL_SETTINGS)}
      WHERE setting_group = ${group}
    `);

    const result = {};

    rows.forEach(r => {
      result[r.field_name] = r.value;
    });

    return JsonResponse.success(result);

  } catch (err) {

    console.error("[settings/get]", err);

    return JsonResponse.error(
      "Unable to load settings"
    );
  }
}
