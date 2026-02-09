import { DB_Insert, DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";
import { getNextRegNo } from "@/helper/regNo";

export async function POST(req) {

  try {

    const body = await req.json();

    /**
     * rows: [
     *  {
     *   name,
     *   callname,
     *   phone_number,
     *   email,
     *   club_name,
     *   designation,
     *   custom_fields: [
     *      { label, value }
     *   ]
     *  }
     * ]
     */

    const { rows, event_id } = body;

    if (!rows?.length) {
      return JsonResponse.error("No rows found");
    }

    for (const row of rows) {

      const regnNo = await getNextRegNo();

      if (!regnNo) {
        return JsonResponse.error(
          "Please configure Registration No in Settings screen"
        );
      }

      const delegateId = await DB_Insert(sql`
        INSERT INTO ${sql.identifier(
          Tables.TBL_EVENT_DELEGATES
        )}
        (
          fkevent_id,
          regn_no,
          name,
          callname,
          phone_number,
          email,
          club_name,
          designation
        )
        VALUES (
          ${event_id},
          ${regnNo},
          ${row.name},
          ${row.callname},
          ${row.phone_number},
          ${row.email},
          ${row.club_name},
          ${row.designation}
        )
      `, "delegate_id");

      for (const c of row.custom_fields || []) {

        await DB_Insert(sql`
          INSERT INTO ${sql.identifier(
            Tables.TBL_CUSTOM_FIELD_DELEGATES
          )}
          (
            fkevent_id,
            fkdelegates_id,
            label,
            value
          )
          VALUES (
            ${event_id},
            ${delegateId},
            ${c.label},
            ${c.value}
          )
        `);
      }
    }

    return JsonResponse.success(
      {},
      "Delegates imported successfully"
    );

  } catch (err) {

    console.error("IMPORT ERROR", err);

    return JsonResponse.error(
      "Error importing delegates"
    );
  }
}
