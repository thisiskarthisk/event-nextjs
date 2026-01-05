import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req) {
  try {
    console.log("GET /organizationChart/childrenRoles called");
    console.log("Request URL:", req.url);

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    if (!user_id) {
      return JsonResponse.error("Missing user_id parameter", 400);
    }
    let sqlQuery = `WITH RECURSIVE role_tree AS (
    SELECT
        r.id,
        r.name,
        r.reporting_to,
        0 AS level
    FROM ${Tables.TBL_ROLES} r
    JOIN ${Tables.TBL_ROLE_USERS} ur ON ur.role_id = r.id
    WHERE ur.user_id = ${user_id}
      AND ur.active = true

    UNION ALL
    SELECT
        r.id,
        r.name,
        r.reporting_to,
        rt.level + 1
    FROM ${Tables.TBL_ROLES} r
    JOIN role_tree rt
      ON r.reporting_to = rt.id
)
SELECT
    ur.role_id,
    rt.name AS role_name,
    MIN(rt.level) AS level,
    COUNT(ur.user_id) AS user_count
FROM role_tree rt
JOIN ${Tables.TBL_ROLE_USERS} ur
  ON ur.role_id = rt.id
WHERE rt.level > 0
  AND ur.active = true
GROUP BY ur.role_id, rt.name
ORDER BY level, ur.role_id;`;

    const result = await DB_Fetch(sqlQuery);

    return JsonResponse.success(result);
  } catch (error) {
    console.error("Error in /organizationChart/childrenRoles:", error);
    return JsonResponse.error("Server error: " + error.message);
  }
}