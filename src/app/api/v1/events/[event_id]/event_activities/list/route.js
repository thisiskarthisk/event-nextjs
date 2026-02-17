import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {
  const result = await DB_Fetch(`
    SELECT
      ea.*,
      TO_CHAR(ea.start_datetime, 'DD-MM-YYYY HH12:MI:SS') AS start_date,
      TO_CHAR(ea.end_datetime, 'DD-MM-YYYY HH12:MI:SS') AS end_date,
      e.event_name,
      CASE
        WHEN activity_category = 'non-food' THEN 'Non-Food'
        WHEN activity_category = 'food' THEN 'Food'
        ELSE activity_category
      END AS activity_category,
      CASE
        WHEN meal_type = 'any' THEN 'Any'
        WHEN meal_type = 'veg' THEN 'Veg'
        WHEN meal_type = 'non-veg' THEN 'Non-Veg'
        ELSE meal_type
      END AS meal_type
    FROM
      ${Tables.TBL_EVENT_ACTIVITIES} AS ea
    INNER JOIN ${Tables.TBL_EVENTS} AS e
      ON e.event_id = ea.fkevent_id
    WHERE e.active = TRUE
      AND ea.active = TRUE
    ORDER BY e.event_id DESC
  `);

  return JsonResponse.success({
    event_activities: result,
  });
}
