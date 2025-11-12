// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { DB_Fetch, DB_Insert, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";
// import { sql } from "drizzle-orm";

// /**
//  * POST /api/v1/organizationChart/save
//  * Add Role or User
//  */
// export async function POST(req) {
//   try {
//     const { type, name, role_id } = await req.json();

//     if (!name) {
//       return JsonResponse.error("Name is required", 400);
//     }

//     if (type === "role") {
//       // 🟩 Create new role under a parent (reporting_to = role_id)
//       const inserted = await DB_Fetch(sql`
//         INSERT INTO ${sql.identifier(Tables.TBL_ROLES)} (name, reporting_to)
//         VALUES (${name}, ${role_id || null})
//         RETURNING id
//       `);

//       return JsonResponse.success(
//         { id: inserted[0].id },
//         "✅ Role added successfully"
//       );
//     }

//     if (type === "user") {
//       if (!role_id) {
//         return JsonResponse.error("Role ID is required for adding user", 400);
//       }

//       // Check existing user
//       const existing = await DB_Fetch(sql`
//         SELECT id FROM ${sql.identifier(Tables.TBL_USERS)}
//         WHERE LOWER(first_name) = LOWER(${name})
//         LIMIT 1
//       `);

//       let userId;
//       if (existing.length > 0) {
//         userId = existing[0].id;
//       } else {
//         const newUser = await DB_Fetch(sql`
//           INSERT INTO ${sql.identifier(Tables.TBL_USERS)}
//             (employee_id, user_type, first_name, email, password)
//           VALUES
//             (GEN_RANDOM_UUID(), 'employee', ${name}, ${name.toLowerCase()} || '@company.com', 'password123')
//           RETURNING id
//         `);
//         userId = newUser[0].id;
//       }

//       // Assign user to role
//       await DB_Insert(sql`
//         INSERT INTO ${sql.identifier(Tables.TBL_ROLE_USERS)} (role_id, user_id)
//         VALUES (${role_id}, ${userId})
//       `);

//       return JsonResponse.success(
//         { id: userId },
//         "✅ User added successfully"
//       );
//     }

//     return JsonResponse.error("Invalid request type", 400);
//   } catch (error) {
//     console.error("[api/v1/organizationChart/save] Error:", error);
//     return JsonResponse.error("Server error: " + error.message, 500);
//   }
// }


export const runtime = "nodejs";

import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

/**
 * POST /api/v1/organizationChart/save
 * Handles Add/Edit Role or User
 */
export async function POST(req) {
  try {
    const { type, name, role_id, reporting_to, user_id } = await req.json();

    if (!type) return JsonResponse.error("Missing request type", 400);

    // 🔒 Validate name for role/user
    if (type !== "deleteRole" && type !== "deleteUser") {
      if (!name || !name.trim()) return JsonResponse.error("Name is required", 400);
    }

    /* =====================================================
       ROLE ADD / EDIT
    ===================================================== */
    if (type === "addRole") {
      const parentId = reporting_to || null;

      const inserted = await DB_Fetch(sql`
        INSERT INTO roles (name, reporting_to, active)
        VALUES (${name.trim()}, ${parentId}, TRUE)
        RETURNING id
      `);

      return JsonResponse.success(
        { id: inserted[0].id },
        "✅ Role added successfully"
      );
    }

    if (type === "editRole") {
      if (!role_id) return JsonResponse.error("Missing role_id for editRole", 400);

      await DB_Fetch(sql`
        UPDATE roles
        SET name = ${name.trim()}, updated_at = NOW()
        WHERE id = ${role_id}
      `);

      return JsonResponse.success({}, "✅ Role updated successfully");
    }

    /* =====================================================
       USER ADD / EDIT
    ===================================================== */
    if (type === "addUser" || type === "editUser") {
      if (!role_id) return JsonResponse.error("Missing role_id for user", 400);
      if (!name || !name.trim()) return JsonResponse.error("User name is required", 400);

      let userId = user_id || null;

      if (type === "editUser" && user_id) {
        // Update user
        await DB_Fetch(sql`
          UPDATE users
          SET first_name = ${name.trim()},
              email = LOWER(${name.trim()}) || '@company.com',
              updated_at = NOW()
          WHERE id = ${user_id}
        `);
        userId = user_id;
      } else {
        // Add user
        const existing = await DB_Fetch(sql`
          SELECT id FROM users
          WHERE LOWER(first_name) = LOWER(${name.trim()})
          AND active = TRUE
          LIMIT 1
        `);

        if (existing.length > 0) {
          userId = existing[0].id;
        } else {
          const newUser = await DB_Fetch(sql`
            INSERT INTO users (employee_id, user_type, first_name, email, password, active)
            VALUES (GEN_RANDOM_UUID(), 'employee', ${name.trim()}, LOWER(${name.trim()}) || '@company.com', 'password123', TRUE)
            RETURNING id
          `);
          userId = newUser[0].id;
        }
      }

      // Ensure role-user mapping
      const existingRoleUser = await DB_Fetch(sql`
        SELECT id FROM role_users
        WHERE role_id = ${role_id} AND user_id = ${userId}
        LIMIT 1
      `);

      if (existingRoleUser.length > 0) {
        await DB_Fetch(sql`
          UPDATE role_users
          SET active = TRUE, updated_at = NOW()
          WHERE id = ${existingRoleUser[0].id}
        `);
      } else {
        await DB_Fetch(sql`
          INSERT INTO role_users (role_id, user_id, active)
          VALUES (${role_id}, ${userId}, TRUE)
        `);
      }

      return JsonResponse.success(
        { id: userId },
        type === "editUser" ? "✅ User updated successfully" : "✅ User added successfully"
      );
    }

    return JsonResponse.error("Invalid request type", 400);
  } catch (error) {
    console.error("[api/v1/organizationChart/save] Error:", error);
    return JsonResponse.error("Server error: " + error.message, 500);
  }
}
