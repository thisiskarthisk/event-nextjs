import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import Validation from "@/helper/validation";
import { sql } from "drizzle-orm";

export async function POST(req) {

  try {

    const data = await req.json();

    const id = data.event_id;
    const event_id = Number(id);
    const setting_group = data.setting_group;
    const settings = data.settings;

    const rules = {
      event_id: "required",
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

    for (const item of settings) {

      const { field_name, value } = item;

      if (!field_name) continue;

      const trimmedValue = value?.toString().trim();


      const existing = await DB_Fetch(sql`
        SELECT id
        FROM ${sql.identifier(Tables.TBL_SETTINGS)}
        WHERE field_name = ${field_name}
          AND setting_group = ${setting_group}
          AND fkevent_id = ${event_id}
        LIMIT 1
      `);

      if (!trimmedValue) {

        if (existing.length) {
          await DB_Fetch(sql`
            DELETE FROM ${sql.identifier(Tables.TBL_SETTINGS)}
            WHERE id = ${existing[0].id}
          `);
        }

        continue;
      }


      if (existing.length > 0) {

        await DB_Fetch(sql`
          UPDATE ${sql.identifier(Tables.TBL_SETTINGS)}
          SET value = ${value}, updated_at = NOW()
          WHERE id = ${existing[0].id}
        `);

      } else {

        await DB_Insert(sql`
          INSERT INTO ${sql.identifier(Tables.TBL_SETTINGS)}
          (fkevent_id, field_name, value, setting_group)
          VALUES (${event_id}, ${field_name}, ${value}, ${setting_group})
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
