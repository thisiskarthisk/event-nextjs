import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req, context) {
  try {
    const role_id = req.nextUrl.searchParams.get("role_id"); /* User ID change in Role ID */

    if (!role_id) return JsonResponse.error("role_id is required", 400);  /* Add New Line */

    const result = await DB_Fetch(`
      SELECT
        rob.*
      FROM
        ${Tables.TBL_ROLES} AS r
      INNER JOIN ${Tables.TBL_ROLE_OBJECTIVES} AS rob    /* Remove Role User Join */
        ON rob.role_id = r.id
      WHERE
        r.id = ${role_id}  /* Not User Id ...Role ID base */
        AND r.active = TRUE
    `);

    const role_user = await DB_Fetch(`
      SELECT
        r.*
      FROM
        ${Tables.TBL_ROLES} AS r  /* User Join Remove */
      WHERE
        r.id = ${role_id}
        AND r.active = TRUE
    `);
    
    return JsonResponse.success({
      roles: result,
      role_user : role_user || null,
    });

  } catch (error) {
    console.error("Error fetching roles:", error);
    return JsonResponse.error("Failed to fetch roles", 500);
  }
}




// import { DB_Fetch, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function GET(req, context) {
//   try {
//     const role_id = req.nextUrl.searchParams.get("role_id");
//     // console.log("GET /roles called with role_id:", role_id);

//     if (!role_id) return JsonResponse.error("role_id is required", 400);

//     // Fetch role objectives for this role
//     const result = await DB_Fetch(
//       `
//       SELECT rob.*
//       FROM ${Tables.TBL_ROLES} AS r
//       INNER JOIN ${Tables.TBL_ROLE_OBJECTIVES} AS rob
//         ON rob.role_id = r.id
//       WHERE r.id = ${role_id}
//         AND r.active = TRUE
//       `,
//     );

//     // Fetch the role object itself
//     const role_user = await DB_Fetch(
//       `
//       SELECT r.*
//       FROM ${Tables.TBL_ROLES} AS r
//       WHERE r.id = ${role_id}
//         AND r.active = TRUE
//       `,
//     );

//     // console.log("Fetched objectives for role_id:", role_id, result);
//     // console.log("Fetched role for role_id:", role_id, role_user);

//     return JsonResponse.success({
//       roles: result,
//       role_user: role_user || null
//     });

//   } catch (error) {
//     console.error("Error fetching role data:", error);
//     return JsonResponse.error("Failed to fetch role data", 500);
//   }
// }
