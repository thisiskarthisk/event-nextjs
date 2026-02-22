import { DB_Fetch , Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) return JsonResponse.error("Unauthorized");

  const userId = token.id;

  const events = await DB_Fetch(`
    SELECT e.*,
      TO_CHAR(e.event_start_datetime, 'DD-MM-YYYY HH12:MI') AS start_date,
      TO_CHAR(e.event_end_datetime, 'DD-MM-YYYY HH12:MI') AS end_date
    FROM ${Tables.TBL_EVENTS} e
    INNER JOIN ${Tables.TBL_USER_EVENTS} ue
      ON ue.fkevent_id = e.event_id
    WHERE ue.fkuser_id = ${userId}
    AND e.active = TRUE
  `);

  for (let event of events) {

    const activities = await DB_Fetch(`
      SELECT *,
      TO_CHAR(start_datetime, 'DD-MM-YYYY -- HH12:MI') AS start_date,
      TO_CHAR(end_datetime, 'DD-MM-YYYY -- HH12:MI') AS end_date
      FROM ${Tables.TBL_EVENT_ACTIVITIES} 
      WHERE fkevent_id = ${event.event_id}
      AND active = TRUE
    `);

    for (let activity of activities) {

      const delegates = await DB_Fetch(`
        SELECT 
          d.*,
          CASE 
            WHEN eda.delegate_activity_id IS NOT NULL THEN TRUE
            ELSE FALSE
          END AS registered
        FROM ${Tables.TBL_EVENT_DELEGATES} d
        LEFT JOIN ${Tables.TBL_EVENT_DELEGATE_ACTIVITIES} eda
          ON eda.fkdelegates_id = d.delegate_id
          AND eda.fkactivity_id = ${activity.event_activity_id}
          AND eda.fkevent_id = ${event.event_id}
          AND eda.active = TRUE
        WHERE d.fkevent_id = ${event.event_id}
        AND d.active = TRUE
      `);

      activity.delegates = delegates;
    }

    event.activities = activities;
  }

  return JsonResponse.success({ events });
}
