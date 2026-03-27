import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {

  const result = await DB_Fetch(`
    SELECT
      ${Tables.PublicFields[Tables.TBL_USERS].join(', ')},
      CASE
        WHEN user_type = 'site_admin' THEN 'Site Admin'
        WHEN user_type = 'event_admin' THEN 'Event Admin'
        WHEN user_type = 'event_user' THEN 'Event User'
        ELSE user_type
      END AS user_type
    FROM
      ${Tables.TBL_USERS}
    WHERE active = TRUE
    ORDER BY id DESC
  `);

  const result2 = await DB_Fetch(`
    SELECT
      ${Tables.PublicFields[Tables.TBL_USERS].join(', ')},
      CASE
        WHEN user_type = 'site_admin' THEN 'Site Admin'
        WHEN user_type = 'event_admin' THEN 'Event Admin'
        WHEN user_type = 'event_user' THEN 'Event User'
        ELSE user_type
      END AS user_type
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
