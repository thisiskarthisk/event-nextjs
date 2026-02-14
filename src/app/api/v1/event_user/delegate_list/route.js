// import { DB_Fetch } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function POST(req) {
//   const { event_id, activity_id } = await req.json();

//   const delegates = await DB_Fetch(`
//     SELECT 
//       d.*,
//       CASE 
//         WHEN eda.delegate_activity_id IS NOT NULL THEN TRUE
//         ELSE FALSE
//       END AS registered
//     FROM event_delegates d
//     LEFT JOIN event_delegate_activities eda
//       ON eda.fkdelegates_id = d.delegate_id
//       AND eda.fkactivity_id = ${activity_id}
//       AND eda.fkevent_id = ${event_id}
//       AND eda.active = TRUE
//     WHERE d.fkevent_id = ${event_id}
//   `);

// return JsonResponse.success({
//   delegates: delegates
// });
// }



// import { DB_Fetch } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function POST(req) {

//   const body = await req.json();
//   const { event_id, activity_id } = body;

//   const delegates = await DB_Fetch(`
//     SELECT 
//       d.*,
//       CASE 
//         WHEN eda.delegate_activity_id IS NOT NULL THEN TRUE
//         ELSE FALSE
//       END AS registered
//     FROM event_delegates d
//     LEFT JOIN event_delegate_activities eda
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



import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req) {

  const event_id = req.nextUrl.searchParams.get("event_id");
  const activity_id = req.nextUrl.searchParams.get("activity_id");

  if (!event_id || !activity_id) {
    return JsonResponse.error("Missing parameters");
  }

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
      AND eda.fkactivity_id = ${activity_id}
      AND eda.fkevent_id = ${event_id}
      AND eda.active = TRUE
    WHERE d.fkevent_id = ${event_id}
    ORDER BY d.delegate_id DESC
  `);

  return JsonResponse.success({
    delegates
  });
}
