import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {
  const result = await DB_Fetch(`
    SELECT
      ${Tables.PublicFields[Tables.TBL_USERS].join(', ')}
    FROM
      ${Tables.TBL_USERS}
    WHERE active = TRUE
  `);

  return JsonResponse.success({
    'users': result,
  });
}
