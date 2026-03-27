import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {
  const result = await DB_Fetch(`
    SELECT
      e.*,
      TO_CHAR(e.event_start_datetime, 'DD-MM-YYYY HH12:MI:SS') AS start_date,
      TO_CHAR(e.event_end_datetime, 'DD-MM-YYYY HH12:MI:SS') AS end_date
    FROM
      ${Tables.TBL_EVENTS} AS e
    WHERE e.active = TRUE
    ORDER BY e.event_id DESC
  `);

  return JsonResponse.success({
    events: result,
  });
}
