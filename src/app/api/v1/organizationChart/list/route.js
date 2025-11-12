// import { DB_Fetch, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function GET() {
//   const result = await DB_Fetch(`
//     SELECT
//       r.id,
//       r.name,
//       r.reporting_to,
//       r.note,
//       COALESCE(
//         STRING_AGG(u.first_name, ', ' ORDER BY u.first_name),
//         ''
//       ) AS users
//     FROM ${Tables.TBL_ROLES} r
//     LEFT JOIN ${Tables.TBL_ROLE_USERS} ru ON ru.role_id = r.id
//     LEFT JOIN ${Tables.TBL_USERS} u ON u.id = ru.user_id
//     WHERE r.active = TRUE
//     GROUP BY r.id, r.name, r.reporting_to, r.note
//     ORDER BY r.id
//   `);

//   return JsonResponse.success({
//     roles: result,
//   });
// }


import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

/**
 * Returns active roles and users in org chart structure
 */
export async function GET() {
  try {
    const roles = await DB_Fetch(sql`
      SELECT r.id, r.name, r.reporting_to,
        COALESCE(STRING_AGG(u.first_name, ','), '') AS users
      FROM ${sql.identifier(Tables.TBL_ROLES)} r
      LEFT JOIN ${sql.identifier(Tables.TBL_ROLE_USERS)} ru ON ru.role_id = r.id AND ru.active = TRUE
      LEFT JOIN ${sql.identifier(Tables.TBL_USERS)} u ON u.id = ru.user_id AND u.active = TRUE
      WHERE r.active = TRUE
      GROUP BY r.id, r.name, r.reporting_to
      ORDER BY r.id
    `);

    return JsonResponse.success({ roles });
  } catch (error) {
    console.error("Error in /organizationChart/list:", error);
    return JsonResponse.error("Server error: " + error.message);
  }
}
