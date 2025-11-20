import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req) {
  const id = req.nextUrl.searchParams.get("id");   // <-- Correct
  const userId = Number(id);

  if (!userId) {
    return JsonResponse.error("User ID is required.");
  }

  const rows = await DB_Fetch(sql`
    SELECT id, employee_id, first_name, last_name, email, mobile_no
    FROM ${sql.identifier(Tables.TBL_USERS)}
    WHERE active = TRUE AND id = ${userId}
    ORDER BY id DESC
  `);

  return JsonResponse.success(rows[0] || {});
}
