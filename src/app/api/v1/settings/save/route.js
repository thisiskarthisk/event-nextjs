import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import Validation from "@/helper/validation";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const data = await req.json();

    /**
     * data example expected:
     * {
     *   setting_group: "general",
     *   settings: [
     *     { field_name: "employee_id", value: "EMP-" },
     *     { field_name: "rca_id", value: "RCA-" },
     *     { field_name: "capa_id", value: "CAPA-" }
     *   ]
     * }
     */

    const rules = {
      setting_group: "required",
      settings: "required|array"
    };

    const errors = Validation(data, rules);
    if (errors && Object.keys(errors).length > 0) {
      return JsonResponse.error("Please correct the errors.", 422, errors);
    }

    const group = data.setting_group;
    const settings = data.settings;

    // SAVE EACH SETTING
    for (const item of settings) {
      const { field_name, value } = item;

      // find if exists
      const existing = await DB_Fetch(sql`
        SELECT id FROM ${sql.identifier(Tables.TBL_SETTINGS)}
        WHERE field_name = ${field_name}
        AND setting_group = ${group}
        LIMIT 1
      `);

      if (existing.length > 0) {
        // UPDATE
        await DB_Fetch(sql`
          UPDATE ${sql.identifier(Tables.TBL_SETTINGS)}
          SET value = ${value}, updated_at = NOW()
          WHERE id = ${existing[0].id}
        `);
      } else {
        // INSERT
        await DB_Insert(sql`
          INSERT INTO ${sql.identifier(Tables.TBL_SETTINGS)}
            (field_name, value, setting_group)
          VALUES
            (${field_name}, ${value}, ${group})
        `);
      }
    }

    return JsonResponse.success(
      {},
      "Settings saved successfully."
    );

  } catch (error) {
    console.error("[api/settings/save] Error:", error);
    return JsonResponse.error("Error saving settings.");
  }
}