import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {
  const result = await DB_Fetch(`
    SELECT
      *
    FROM
      ${Tables.TBL_ROLES}
    WHERE active = TRUE
  `);

  return JsonResponse.success({
    'users': result,
  });
}
