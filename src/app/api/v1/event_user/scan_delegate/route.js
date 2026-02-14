// import { DB_Fetch } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function POST(req) {
//   const { regn_no, event_id, activity_id } = await req.json();

//   const delegate = await DB_Fetch(`
//     SELECT delegate_id
//     FROM event_delegates
//     WHERE LOWER(TRIM(regn_no)) = LOWER(TRIM('${regn_no}'))
//     AND fkevent_id = ${event_id}
//     LIMIT 1
//   `);

//   if (!delegate.length)
//     return JsonResponse.error("Delegate not found");

//   const delegateId = delegate[0].delegate_id;

//   const exists = await DB_Fetch(`
//     SELECT 1 FROM event_delegate_activities
//     WHERE fkdelegates_id = ${delegateId}
//     AND fkactivity_id = ${activity_id}
//     AND active = TRUE
//   `);

//   if (exists.length)
//     return JsonResponse.success({ message: "Already Registered" });

//   await DB_Fetch(`
//     INSERT INTO event_delegate_activities
//     (fkevent_id, fkdelegates_id, fkactivity_id, activity_date, attended_status)
//     VALUES (${event_id}, ${delegateId}, ${activity_id}, CURRENT_DATE, 'Registered')
//   `);

//   return JsonResponse.success({ message: "Registration Successful" });
// }



import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function POST(req) {
  try {
    const { regn_no, event_id, activity_id } = await req.json();

    if (!regn_no || !event_id || !activity_id) {
      return JsonResponse.error("Missing data");
    }

    // 1️⃣ Get Delegate
    const delegate = await DB_Fetch(`
      SELECT delegate_id
      FROM event_delegates
      WHERE LOWER(TRIM(regn_no)) = LOWER(TRIM('${regn_no}'))
      AND fkevent_id = ${event_id}
      LIMIT 1
    `);

    if (!delegate.length)
      return JsonResponse.error("Delegate not found");

    const delegateId = delegate[0].delegate_id;

    // 2️⃣ Get Activity multiple_allowed flag
    const activity = await DB_Fetch(`
      SELECT multiple_allowed
      FROM event_activities
      WHERE event_activity_id = ${activity_id}
      LIMIT 1
    `);

    if (!activity.length)
      return JsonResponse.error("Activity not found");

    const multipleAllowed = activity[0].multiple_allowed;

    // 3️⃣ If multiple_allowed = FALSE → check duplicate
    if (!multipleAllowed) {

      const exists = await DB_Fetch(`
        SELECT 1 FROM event_delegate_activities
        WHERE fkdelegates_id = ${delegateId}
        AND fkactivity_id = ${activity_id}
        AND active = TRUE
      `);

      if (exists.length) {
        return JsonResponse.success({
          message: "This Delegate already Registered",
          type: "warning"
        });
      }
    }

    // 4️⃣ Insert attendance
    await DB_Fetch(`
      INSERT INTO event_delegate_activities
      (fkevent_id, fkdelegates_id, fkactivity_id, activity_date, attended_status)
      VALUES (${event_id}, ${delegateId}, ${activity_id}, CURRENT_DATE, 'Registered')
    `);

    return JsonResponse.success({
      message: "Registration Successful",
      type: "success"
    });

  } catch (err) {
    console.error("SCAN ERROR:", err);
    return JsonResponse.error("Scan failed");
  }
}
