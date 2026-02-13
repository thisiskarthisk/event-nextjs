import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {

  const result = await DB_Fetch(`
    SELECT
      ${Tables.PublicFields[Tables.TBL_USERS].join(', ')}
    FROM
      ${Tables.TBL_USERS}
    WHERE active = TRUE
    ORDER BY id DESC
  `);

  const result2 = await DB_Fetch(`
    SELECT
      ${Tables.PublicFields[Tables.TBL_USERS].join(', ')}
    FROM
      ${Tables.TBL_USERS}
    WHERE user_type = 'event_user' and active = TRUE
    ORDER BY id DESC
  `);

  console.log('result', result);
  console.log('result2', result2);

  return JsonResponse.success({
    'users': result,
    'event_users': result2,
  });
}
