import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import Validation from "@/helper/validation";
import { sql } from "drizzle-orm";

export async function POST(req) {

  try {

    const data = await req.json();

    /**
     * Expected:
     * {
     *   setting_group: "general",
     *   settings: [
     *     { field_name: "regn_no", value: "edv,5" },
     *     { field_name: "whatsapp_phone_id", value: "107621335632571" },
     *     { field_name: "whatsapp_template", value: "lfrcr_rotary" },
     *     { field_name: "whatsapp_token", value: "EAA..." },
     *     { field_name: "gmail_smtp_host", value: "smtp.gmail.com" },
     *     { field_name: "gmail_smtp_port", value: "587" },
     *     { field_name: "gmail_smtp_user", value: "karthi@gmail.com" },
     *     { field_name: "gmail_smtp_pass", value: "1254785jsgaej" }
     *   ]
     * }
     */

    const rules = {
      setting_group: "required",
      settings: "required|array",
    };

    const errors = Validation(data, rules);

    if (errors) {
      return JsonResponse.error(
        "Validation failed",
        422,
        errors
      );
    }

    const { setting_group, settings } = data;

    for (const item of settings) {

      const { field_name, value } = item;

      if (!field_name) continue;

      const existing = await DB_Fetch(sql`
        SELECT id
        FROM ${sql.identifier(Tables.TBL_SETTINGS)}
        WHERE field_name = ${field_name}
          AND setting_group = ${setting_group}
        LIMIT 1
      `);

      if (existing.length) {

        await DB_Fetch(sql`
          UPDATE ${sql.identifier(Tables.TBL_SETTINGS)}
          SET value = ${value}, updated_at = NOW()
          WHERE id = ${existing[0].id}
        `);

      } else {

        await DB_Insert(sql`
          INSERT INTO ${sql.identifier(Tables.TBL_SETTINGS)}
          (field_name, value, setting_group)
          VALUES (${field_name}, ${value}, ${setting_group})
        `);
      }
    }

    return JsonResponse.success(
      {},
      "Settings saved successfully."
    );

  } catch (err) {

    console.error("[settings/save]", err);

    return JsonResponse.error(
      "Error saving settings."
    );
  }
}
