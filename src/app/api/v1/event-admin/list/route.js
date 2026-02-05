//login user which event assign that event get list

import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  try {

    // ✅ GET LOGIN USER FROM SESSION TOKEN
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return JsonResponse.error("Unauthorized", 401);
    }

    const userId = token.id;
    const userType = token.user_type;

    let query = `
      SELECT
        e.*,
        TO_CHAR(e.event_start_datetime, 'DD-MM-YYYY HH12:MI:SS') AS start_date,
        TO_CHAR(e.event_end_datetime, 'DD-MM-YYYY HH12:MI:SS') AS end_date
      FROM ${Tables.TBL_EVENTS} e
      INNER JOIN ${Tables.TBL_USER_EVENTS} ue
        ON ue.fkevent_id = e.event_id
      WHERE ue.fkuser_id = ${userId}
        AND e.active = TRUE
    `;

    // 👉 if site_admin → see all
    if (userType === "site_admin") {
      query = `
        SELECT
          e.*,
          TO_CHAR(e.event_start_datetime, 'DD-MM-YYYY HH12:MI:SS') AS start_date,
          TO_CHAR(e.event_end_datetime, 'DD-MM-YYYY HH12:MI:SS') AS end_date
        FROM ${Tables.TBL_EVENTS} e
        WHERE e.active = TRUE
      `;
    }

    query += ` ORDER BY e.event_id DESC`;

    const result = await DB_Fetch(query);

    return JsonResponse.success({
      events: result,
    });

  } catch (err) {
    console.error("EVENT LIST ERROR:", err);
    return JsonResponse.error("Failed to load events");
  }
}
