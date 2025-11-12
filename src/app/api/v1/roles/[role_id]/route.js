import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(request, context) {

  const { role_id } = await context.params;

  const result = await DB_Fetch(`
    SELECT
      *
    FROM
      ${Tables.TBL_ROLE_OBJECTIVES}
    WHERE 
      role_id = '${ role_id }'
      AND active = TRUE
  `);

  return JsonResponse.success({
    'roles': result,
  });
}
