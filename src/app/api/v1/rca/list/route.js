import { DB_Fetch ,Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET() {
  const result = await DB_Fetch(`
    SELECT
      *
    FROM
      ${Tables.TBL_RCA} AS rca
    WhERE rca.active = TRUE
    ORDER BY rca.id ASC
  `);

  return JsonResponse.success({
    'root_cause_analysis': result,
  });
}
