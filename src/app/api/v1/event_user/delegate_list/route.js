// import { DB_Fetch , Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function GET(req) {

//   const event_id = req.nextUrl.searchParams.get("event_id");
//   const activity_id = req.nextUrl.searchParams.get("activity_id");

//   if (!event_id || !activity_id) {
//     return JsonResponse.error("Missing parameters");
//   }

//   const delegates = await DB_Fetch(`
//     SELECT 
//       d.*,
//       CASE 
//         WHEN eda.delegate_activity_id IS NOT NULL THEN TRUE
//         ELSE FALSE
//       END AS registered
//     FROM ${Tables.TBL_EVENT_DELEGATES} d
//     LEFT JOIN ${Tables.TBL_EVENT_DELEGATE_ACTIVITIES} eda
//       ON eda.fkdelegates_id = d.delegate_id
//       AND eda.fkactivity_id = ${activity_id}
//       AND eda.fkevent_id = ${event_id}
//       AND eda.active = TRUE
//     WHERE d.fkevent_id = ${event_id}
//     ORDER BY d.delegate_id DESC
//   `);

//   return JsonResponse.success({
//     delegates
//   });
// }


// import { DB_Fetch, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function GET(req) {
//   const event_id = Number(req.nextUrl.searchParams.get("event_id"));
//   const activity_id = Number(req.nextUrl.searchParams.get("activity_id"));
//   const status = req.nextUrl.searchParams.get("status") || "all";

//   if (!event_id || !activity_id) {
//     return JsonResponse.error("Missing parameters");
//   }

//   // ✅ Build status condition dynamically
//   let statusCondition = "";

//   if (status === "registered") {
//     statusCondition = "AND eda.delegate_activity_id IS NOT NULL";
//   }

//   if (status === "not_registered") {
//     statusCondition = "AND eda.delegate_activity_id IS NULL";
//   }

//   const delegates = await DB_Fetch(`
//     SELECT 
//       d.*,
//       CASE 
//         WHEN eda.delegate_activity_id IS NOT NULL THEN TRUE
//         ELSE FALSE
//       END AS registered
//     FROM ${Tables.TBL_EVENT_DELEGATES} d
//     LEFT JOIN ${Tables.TBL_EVENT_DELEGATE_ACTIVITIES} eda
//       ON eda.fkdelegates_id = d.delegate_id
//       AND eda.fkactivity_id = ${activity_id}
//       AND eda.fkevent_id = ${event_id}
//       AND eda.active = TRUE
//     WHERE d.fkevent_id = ${event_id}
//     ${statusCondition}
//     ORDER BY d.delegate_id DESC
//   `);

//   return JsonResponse.success({
//     delegates,
//   });
// }



import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req) {
  const event_id = Number(req.nextUrl.searchParams.get("event_id"));
  const activity_id = Number(req.nextUrl.searchParams.get("activity_id"));
  const status = req.nextUrl.searchParams.get("status") || "all";
  const selected_date =
    req.nextUrl.searchParams.get("date") ||
    new Date().toISOString().split("T")[0]; // default = today

  if (!event_id || !activity_id) {
    return JsonResponse.error("Missing parameters");
  }

  let statusCondition = "";

  if (status === "registered") {
    statusCondition = "AND eda.delegate_activity_id IS NOT NULL";
  }

  if (status === "not_registered") {
    statusCondition = "AND eda.delegate_activity_id IS NULL";
  }

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
      AND eda.fkactivity_id = ${activity_id}
      AND eda.fkevent_id = ${event_id}
      AND eda.active = TRUE
      AND DATE(eda.recorded_date_time) = '${selected_date}'
    WHERE d.fkevent_id = ${event_id}
    ${statusCondition}
    ORDER BY d.delegate_id DESC
  `);

  return JsonResponse.success({
    delegates,
  });
}