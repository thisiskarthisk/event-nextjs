// import { DB_Fetch, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";
// import { sql } from "drizzle-orm";

// export async function GET(req) {
//   const id = req.nextUrl.searchParams.get("id");
//   const EventId = Number(id);

//   if (!id || isNaN(EventId)) {
//     return JsonResponse.error("Event ID is required.");
//   }

//   const rows = await DB_Fetch(sql`
//     SELECT *
//     FROM ${sql.identifier(Tables.TBL_EVENTS)}
//     WHERE active = TRUE
//       AND event_id = ${EventId}
//     LIMIT 1
//   `);

//   return JsonResponse.success(rows[0] || {});
// }


export async function GET(req) {
  const id =
    req.nextUrl.searchParams.get("id");

  const ActivityId = Number(id);

  if (!id || isNaN(ActivityId)) {
    return JsonResponse.error(
      "Activity ID is required."
    );
  }

  const rows = await DB_Fetch(`
    SELECT *
    FROM ${Tables.TBL_EVENT_ACTIVITIES}
    WHERE active = TRUE
      AND event_activity_id = ${ActivityId}
    LIMIT 1
  `);

  return JsonResponse.success(rows[0] || {});
}
