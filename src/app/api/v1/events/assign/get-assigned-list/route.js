// src/app/api/v1/events/assign/get-assigned/route.js
import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";


export async function POST(req) {
  const { event_id, role } = await req.json();
  
  const assigned = await DB_Fetch(sql`
    SELECT fkuser_id FROM ${sql.identifier(Tables.TBL_USER_EVENTS)}
    WHERE fkevent_id = ${event_id} AND assigned_event_user = ${role}
  `);

  // Return just an array of IDs: ["1", "5", "12"]
  return JsonResponse.success(assigned.map(row => String(row.fkuser_id)));
}