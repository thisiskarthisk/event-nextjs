export const runtime = "nodejs";

import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

/**
 * POST /api/v1/organizationChart/delete
 * Handles soft delete for role and user
 */
export async function POST(req) {
  try {
    const { type, role_id, user } = await req.json();

    if (!type) return JsonResponse.error("Missing delete type", 400);

    /* =====================================================
       DELETE ROLE (soft delete)
    ===================================================== */
    if (type === "deleteRole") {
      if (!role_id) return JsonResponse.error("Missing role_id", 400);

      // Mark role inactive
      await DB_Fetch(sql`
        UPDATE roles
        SET active = FALSE, updated_at = NOW()
        WHERE id = ${role_id}
      `);

      // Also deactivate related role_users
      await DB_Fetch(sql`
        UPDATE role_users
        SET active = FALSE, updated_at = NOW()
        WHERE role_id = ${role_id}
      `);

      return JsonResponse.success({}, "🗑️ Role deleted (soft delete)");
    }

    /* =====================================================
       DELETE USER FROM ROLE
    ===================================================== */
    if (type === "deleteUser") {
      if (!role_id || !user) return JsonResponse.error("Missing role_id or user", 400);

      // Find user id by name
      const userRec = await DB_Fetch(sql`
        SELECT id FROM users
        WHERE LOWER(first_name) = LOWER(${user})
        LIMIT 1
      `);

      if (userRec.length === 0)
        return JsonResponse.error("User not found", 404);

      const user_id = userRec[0].id;

      // Soft delete mapping
      await DB_Fetch(sql`
        UPDATE role_users
        SET active = FALSE, updated_at = NOW()
        WHERE role_id = ${role_id} AND user_id = ${user_id}
      `);

      return JsonResponse.success({}, "🗑️ User removed from role (soft delete)");
    }

    return JsonResponse.error("Invalid delete request type", 400);
  } catch (error) {
    console.error("[api/v1/organizationChart/delete] Error:", error);
    return JsonResponse.error("Server error: " + error.message, 500);
  }
}
