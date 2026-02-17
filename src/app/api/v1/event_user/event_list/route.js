// // //login user which event assign that event get list

// // import { DB_Fetch, Tables } from "@/db";
// // import { JsonResponse } from "@/helper/api";
// // import { getToken } from "next-auth/jwt";

// // export async function GET(req) {
// //   try {

// //     // ✅ GET LOGIN USER FROM SESSION TOKEN
// //     const token = await getToken({
// //       req,
// //       secret: process.env.NEXTAUTH_SECRET,
// //     });

// //     if (!token) {
// //       return JsonResponse.error("Unauthorized", 401);
// //     }

// //     const userId = token.id;
// //     const userType = token.user_type;

// //     let query = `
// //       SELECT
// //         e.*,
// //         TO_CHAR(e.event_start_datetime, 'DD-MM-YYYY HH12') AS start_date,
// //         TO_CHAR(e.event_end_datetime, 'DD-MM-YYYY HH12') AS end_date
// //       FROM ${Tables.TBL_EVENTS} e
// //       INNER JOIN ${Tables.TBL_USER_EVENTS} ue
// //         ON ue.fkevent_id = e.event_id
// //       WHERE ue.fkuser_id = ${userId}
// //         AND e.active = TRUE
// //     `;

// //     // 👉 if site_admin → see all
// //     if (userType === "site_admin") {
// //       query = `
// //         SELECT
// //           e.*,
// //           TO_CHAR(e.event_start_datetime, 'DD-MM-YYYY HH12:MI:SS') AS start_date,
// //           TO_CHAR(e.event_end_datetime, 'DD-MM-YYYY HH12:MI:SS') AS end_date
// //         FROM ${Tables.TBL_EVENTS} e
// //         WHERE e.active = TRUE
// //       `;
// //     }

// //     query += ` ORDER BY e.event_id DESC`;

// //     const result = await DB_Fetch(query);

// //     return JsonResponse.success({
// //       events: result,
// //     });

// //   } catch (err) {
// //     console.error("EVENT LIST ERROR:", err);
// //     return JsonResponse.error("Failed to load events");
// //   }
// // }


// import { DB_Fetch, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";
// import { getToken } from "next-auth/jwt";

// export async function GET(req) {
//   try {

//     const token = await getToken({
//       req,
//       secret: process.env.NEXTAUTH_SECRET,
//     });

//     if (!token) {
//       return JsonResponse.error("Unauthorized", 401);
//     }

//     const userId = token.id;
//     const userType = token.user_type;

//     let query = `
//       SELECT
//         e.*,
//         TO_CHAR(e.event_start_datetime, 'DD-MM-YYYY HH12:MI:SS') AS start_date,
//         TO_CHAR(e.event_end_datetime, 'DD-MM-YYYY HH12:MI:SS') AS end_date
//       FROM ${Tables.TBL_EVENTS} e
//     `;

//     if (userType === "site_admin") {
//       query += `
//         WHERE e.active = TRUE
//       `;
//     } else {
//       query += `
//         INNER JOIN ${Tables.TBL_USER_EVENTS} ue
//           ON ue.fkevent_id = e.event_id
//         WHERE ue.fkuser_id = ${userId}
//           AND e.active = TRUE
//       `;
//     }

//     query += ` ORDER BY e.event_id DESC`;

//     const events = await DB_Fetch(query);

//     // ✅ Attach activities & delegates
//     for (let event of events) {

//       // Activities
//       const activities = await DB_Fetch(`
//         SELECT *
//         FROM ${Tables.TBL_EVENT_ACTIVITIES} a
//         WHERE fkevent_id = ${event.event_id}
//         AND a.active = TRUE
//         ORDER BY start_datetime ASC
//       `);

//       // Delegates
//       const delegates = await DB_Fetch(`
//         SELECT *
//         FROM ${Tables.TBL_EVENT_DELEGATES} ed
//         WHERE fkevent_id = ${event.event_id}
//         AND ed.active = TRUE
//         ORDER BY delegate_id DESC
//       `);

//       event.activities = activities;
//       event.delegates = delegates;
//     }

//     return JsonResponse.success({
//       events,
//     });

//   } catch (err) {
//     console.error("EVENT LIST ERROR:", err);
//     return JsonResponse.error("Failed to load events");
//   }
// }



import { DB_Fetch } from "@/db";
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
    SELECT e.*
    FROM events e
    INNER JOIN user_events ue
      ON ue.fkevent_id = e.event_id
    WHERE ue.fkuser_id = ${userId}
    AND e.active = TRUE
  `);

  for (let event of events) {

    const activities = await DB_Fetch(`
      SELECT *,
      TO_CHAR(start_datetime, 'DD-MM-YYYY -- HH12:MI') AS start_date,
      TO_CHAR(end_datetime, 'DD-MM-YYYY -- HH12:MI') AS end_date
      FROM event_activities
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
        FROM event_delegates d
        LEFT JOIN event_delegate_activities eda
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
