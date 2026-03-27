import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const body = await req.json();

    // Destructure and validate
    const { event_id, role, users } = body;

    // Strict validation: role must be 0 or 1
    if (event_id === undefined || role === undefined) {
      return JsonResponse.error("Missing required fields: event_id or role.");
    }

    const roleValue = parseInt(role); // Ensure it's a number (0 or 1)
    const roleName = roleValue === 0 ? "Admin" : "User";

    // 1. DELETE: Remove existing records for this event and this specific role
    // This handles unchecking/removing users
    await DB_Fetch(sql`
      DELETE FROM ${sql.identifier(Tables.TBL_USER_EVENTS)}
      WHERE fkevent_id = ${event_id}
      AND assigned_event_user = ${roleValue}
    `);

    // 2. INSERT: If users are selected, add them back
    if (Array.isArray(users) && users.length > 0) {
      for (const uid of users) {
        // We use a loop for inserts; for high performance, a bulk insert is better 
        // but this matches your DB_Fetch pattern
        await DB_Fetch(sql`
          INSERT INTO ${sql.identifier(Tables.TBL_USER_EVENTS)} (
            fkuser_id,
            fkevent_id,
            assigned_event_user
          ) VALUES (
            ${uid},
            ${event_id},
            ${roleValue}
          )
        `);
      }
    }

    // return JsonResponse.success({}, "Assignments updated successfully.");
    return JsonResponse.success(
      {}, 
      `Event ${roleName} Assigned to Event Successfully.`
    );
  } catch (err) {
    console.error("SAVE ASSIGNMENT ERROR:", err);
    return JsonResponse.error("Internal Server Error.");
  }
}

