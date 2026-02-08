import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {
  const result = await DB_Fetch(`
    SELECT
      ed.*
    FROM
      ${Tables.TBL_EVENT_DELEGATES} ed
    WHERE ed.active = TRUE
  `);

  return JsonResponse.success({
    event_delegates: result,
  });
}
