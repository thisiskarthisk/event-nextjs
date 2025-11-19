export const runtime = "nodejs";

import { DB_Fetch, DB_Insert, Tables } from "@/db"; // Assuming Tables is imported here
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

/**
 * POST /api/v1/organizationChart/save
 * Handles Add/Edit Role or Add User (no inline edit)
 */
export async function POST(req) {
  try {
    const { type, name, role_id, reporting_to, user_id } = await req.json();

    if (!type) return JsonResponse.error("Missing request type", 400);

    /* =====================================================
      ADD ROLE  (updated logic)
    ===================================================== */
    if (type === "addRole") {
      if (!name || !name.trim()) {
        return JsonResponse.error("Role name is required", 400);
      }
      const roleName = name.trim();

      // ⭐️ CHECK ACTIVE DUPLICATE — Active = error
      const activeDuplicate = await DB_Fetch(sql`
        SELECT id FROM ${sql.raw(Tables.TBL_ROLES)}
        WHERE LOWER(name) = LOWER(${roleName}) AND active = TRUE
        LIMIT 1
      `);

      if (activeDuplicate.length > 0) {
        return JsonResponse.error(
          `Role "${roleName}" is already available and active. Please choose a different name.`,
          409
        );
      }

      // ⭐️ INACTIVE ROLES SHOULD NOT BE REACTIVATED 
      // (do nothing — just insert new row)

      // Convert reporting_to safely
      let parentId = null;
      if (reporting_to !== undefined && reporting_to !== null && reporting_to !== "") {
        const numericId = Number(reporting_to);
        if (isNaN(numericId)) {
          return JsonResponse.error("Invalid reporting_to value", 400);
        }
        parentId = numericId;
      }

      // ⭐️ ALWAYS INSERT — even if same inactive name exists
      const inserted = await DB_Fetch(sql`
        INSERT INTO ${sql.raw(Tables.TBL_ROLES)} (name, reporting_to, active)
        VALUES (${roleName}, ${parentId}, TRUE)
        RETURNING id
      `);

      return JsonResponse.success(
        { id: inserted[0].id },
        "Role added successfully"
      );
    }



    /* =====================================================
      EDIT ROLE
    ===================================================== */
    if (type === "editRole") {
      if (!role_id) return JsonResponse.error("Missing role_id for editRole", 400);
      const roleName = name.trim();
      const currentRoleId = Number(role_id);

      // ⭐️ DUPLICATE ROLE CHECK for EDIT: Check for an ACTIVE role with the same name, but ensure it's not the current role being edited.
      const existingActiveRole = await DB_Fetch(sql`
        SELECT id FROM ${sql.raw(Tables.TBL_ROLES)}
        WHERE LOWER(name) = LOWER(${roleName}) AND active = TRUE AND id != ${currentRoleId}
        LIMIT 1
      `);
      
      if (existingActiveRole.length > 0) {
         return JsonResponse.error(
            `Role "${roleName}" is already available and active for another role. Please choose a different name.`,
            409
          );
      }

      await DB_Insert(sql`
        UPDATE ${sql.raw(Tables.TBL_ROLES)}
        SET name = ${roleName}, updated_at = NOW()
        WHERE id = ${currentRoleId}
      `);

      return JsonResponse.success({}, "Role updated successfully");
    }

    /* =====================================================
      ADD USER (existing user only, one role per user)
    ===================================================== */
  if (type === "addUser") {
    if (!role_id) return JsonResponse.error("Missing role_id", 400);
    if (!user_id) return JsonResponse.error("Please select a user", 400);

    // ✅ Check if user exists
    const userExists = await DB_Fetch(sql`
      SELECT id FROM ${sql.raw(Tables.TBL_USERS)} WHERE id = ${Number(user_id)} AND active = TRUE LIMIT 1
    `);
    if (userExists.length === 0) {
      return JsonResponse.error("Selected user not found or inactive", 404);
    }

    // ❌ Check if already assigned to another active role
    const existingRole = await DB_Fetch(sql`
      SELECT ru.role_id, r.name AS role_name
      FROM ${sql.raw(Tables.TBL_ROLE_USERS)} ru
      JOIN ${sql.raw(Tables.TBL_ROLES)} r ON r.id = ru.role_id
      WHERE ru.user_id = ${Number(user_id)} AND ru.active = TRUE
      LIMIT 1
    `);

    if (existingRole.length > 0) {
      const assignedRole = existingRole[0];
      return JsonResponse.error(
        `User is already assigned to role "${assignedRole.role_name}". Please remove them from that role first.`,
        409
      );
    }

    // ✅ Check if this role-user combo exists but inactive
    const inactiveMap = await DB_Fetch(sql`
      SELECT id FROM ${sql.raw(Tables.TBL_ROLE_USERS)}
      WHERE role_id = ${Number(role_id)} AND user_id = ${Number(user_id)} AND active = FALSE
      LIMIT 1
    `);

    if (inactiveMap.length > 0) {
      // Reactivate existing mapping
      await DB_Fetch(sql`
        UPDATE ${sql.raw(Tables.TBL_ROLE_USERS)}
        SET active = TRUE, updated_at = NOW()
        WHERE id = ${inactiveMap[0].id}
      `);
    } else {
      // Fresh insert (no RETURNING to avoid errors)
      await DB_Fetch(sql`
        INSERT INTO ${sql.raw(Tables.TBL_ROLE_USERS)} (role_id, user_id, active)
        VALUES (${Number(role_id)}, ${Number(user_id)}, TRUE)
      `);
    }

    return JsonResponse.success(
      { id: user_id },
      "User assigned to role successfully"
    );
  }


    return JsonResponse.error("Invalid request type", 400);
  } catch (error) {
    console.error("[api/v1/organizationChart/save] Error:", error);
    return JsonResponse.error("Server error: " + error.message, 500);
  }
}