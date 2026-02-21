import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { decodeURLParam } from "@/helper/utils";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  const { event_id } = await context.params;
  
  const decoded = decodeURLParam(event_id);
  const eventId = Number(decoded);

  console.log("eventId:", eventId);
  if (!eventId) {
    return NextResponse.json(
      { success: false, message: "Invalid IDs" },
      { status: 400 }
    );
  }
  const result = await DB_Fetch(`
    SELECT
      ed.*
    FROM
      ${Tables.TBL_EVENT_DELEGATES} ed
    WHERE ed.active = TRUE AND ed.fkevent_id = ${eventId}
  `);

  return JsonResponse.success({
    event_delegates: result,
  });
}
