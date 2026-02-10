import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";


export async function GET(req) {
  try {

    const id = req.nextUrl.searchParams.get("id");
    const delegateId = Number(id);

    if (!id || isNaN(delegateId)) {
      return JsonResponse.error("Delegate ID is required.");
    }

    const delegates = await DB_Fetch(sql`
      SELECT *
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE delegate_id = ${delegateId}
      LIMIT 1
    `);

    if (!delegates.length) {
      return JsonResponse.error("Delegate not found.");
    }

    const customFields = await DB_Fetch(sql`
      SELECT cus_id, label, value
      FROM ${sql.identifier(Tables.TBL_CUSTOM_FIELD_DELEGATES)}
      WHERE fkdelegates_id = ${delegateId}
      ORDER BY cus_id ASC
    `);

    return JsonResponse.success({
      delegate: delegates[0],
      custom_fields: customFields,
    });

  } catch (err) {

    console.error("DELEGATE GET ERROR:", err);

    return JsonResponse.error("Error occurred while loading Delegate.");
  }
}
