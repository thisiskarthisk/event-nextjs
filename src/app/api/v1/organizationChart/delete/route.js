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
    const { type, role_id, user_id } = await req.json();

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

      return JsonResponse.success({}, "Role deleted successfully");
    }

    /* =====================================================
       DELETE USER FROM ROLE
    ===================================================== */
    if (type === "deleteUser") {
      if (!role_id || !user_id)
        return JsonResponse.error("Missing role_id or user_id", 400);

      
      // Soft delete mapping
      await DB_Fetch(sql`
        UPDATE role_users
        SET active = FALSE, updated_at = NOW()
        WHERE role_id = ${role_id} AND user_id = ${user_id}
      `);

      return JsonResponse.success({}, "The user role has been removed successfully");
    }

    return JsonResponse.error("Invalid delete request type", 400);
  } catch (error) {
    console.error("[api/v1/organizationChart/delete] Error:", error);
    return JsonResponse.error("Server error: " + error.message, 500);
  }
}
