import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req, context) {
  try {
    const user_id = req.nextUrl.searchParams.get("user_id");

    const result = await DB_Fetch(`
      SELECT
        rob.*
      FROM
        ${Tables.TBL_ROLES} AS r
      INNER JOIN ${Tables.TBL_ROLE_USERS} AS ru 
        ON ru.role_id = r.id
      INNER JOIN ${Tables.TBL_ROLE_OBJECTIVES} AS rob
        ON rob.role_id = r.id
      WHERE
        ru.user_id = ${user_id}
        AND r.active = TRUE
        AND ru.active = TRUE
    `);

    const role_user = await DB_Fetch(`
      SELECT
        r.*
      FROM
        ${Tables.TBL_ROLES} AS r
      INNER JOIN ${Tables.TBL_ROLE_USERS} AS ru 
        ON ru.role_id = r.id
      WHERE
        ru.user_id = ${user_id}
        AND r.active = TRUE
        AND ru.active = TRUE
    `);

    return JsonResponse.success({
      roles: result,
      role_user : role_user,
    });

  } catch (error) {
    console.error("Error fetching roles:", error);
    return JsonResponse.error("Failed to fetch roles", 500);
  }
}
