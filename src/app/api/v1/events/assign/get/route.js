import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req) {
  try {
    // 1. Fetch Potential Admins
    const admins = await DB_Fetch(sql`
      SELECT 
        id, 
        first_name, 
        last_name 
      FROM ${sql.identifier(Tables.TBL_USERS)} AS u
      WHERE u.user_type = 'event_admin' 
        AND u.active = TRUE
      ORDER BY u.first_name ASC
    `);

    // 2. Fetch Potential Users
    const users = await DB_Fetch(sql`
      SELECT 
        id, 
        first_name, 
        last_name 
      FROM ${sql.identifier(Tables.TBL_USERS)} AS u
      WHERE u.user_type = 'event_user' 
        AND u.active = TRUE
      ORDER BY u.first_name ASC
    `);

    // Return both in one object
    return JsonResponse.success({
      eventAdmin: admins,
      eventUser: users
    }, "User lists retrieved successfully.");

  } catch (err) {
    console.error("GET ASSIGN LIST ERROR:", err);
    return JsonResponse.error("Failed to retrieve user lists.");
  }
}