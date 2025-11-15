import { DB_Insert, DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function DELETE(req, { params }) {
  try {
    const { role_id, rs_id } = params;

    if (!role_id || !rs_id) {
      return JsonResponse.error("Missing role_id or rs_id", 400);
    }


    // ✅ Step 1: Check if role sheet exists and get its role_objective_id
    const existingSheet = await DB_Fetch(sql`
      SELECT id, role_objective_id 
      FROM ${sql.identifier(Tables.TBL_ROLE_SHEET)}
      WHERE role_objective_id = ${rs_id}
      LIMIT 1
    `);
    
    if (!existingSheet?.length) {
      return JsonResponse.error("Role sheet not found", 404);
    }

    const role_objective_id = existingSheet[0].role_objective_id;
    const role_sheet_id = existingSheet[0].id;

    console.log('existingSheet', existingSheet);
    
    // ✅ Step 2: Delete related KPIs
    await DB_Insert(sql`
      DELETE FROM ${sql.identifier(Tables.TBL_KPIS)}
      WHERE role_sheet_id = ${role_sheet_id}
    `);

    // ✅ Step 3: Delete the role sheet
    await DB_Insert(sql`
      DELETE FROM ${sql.identifier(Tables.TBL_ROLE_SHEET)}
      WHERE role_objective_id = ${rs_id}
    `);

    // ✅ Step 4 (Optional): Check if this objective has no more role sheets
    const remainingSheets = await DB_Fetch(sql`
      SELECT COUNT(*) AS count 
      FROM ${sql.identifier(Tables.TBL_ROLE_SHEET)}
      WHERE role_objective_id = ${role_objective_id}
    `);

    const remainingCount = parseInt(remainingSheets?.[0]?.count || "0");

    if (remainingCount === 0) {
      // ✅ Delete objective if it has no remaining sheets
      await DB_Insert(sql`
        DELETE FROM ${sql.identifier(Tables.TBL_ROLE_OBJECTIVES)}
        WHERE id = ${role_objective_id}
      `);
    }

    return JsonResponse.success(
      {
        deleted: true,
        sheet_id: rs_id,
        objective_deleted: remainingCount === 0
      },
      "Role sheet deleted successfully."
    );
  } catch (error) {
    console.error("[api/v1/roles/[role_id]/rs/[rs_id]/delete] Error:", error);
    return JsonResponse.error("Error while deleting role sheet", 500);
  }
}
