import { DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const { id } = await req.json();
    const gapAnalysisId = Number(id);

    if (!gapAnalysisId) {
      return JsonResponse.error("Invalid ID.");
    }

    // ---------------------------------------------------
    // 1. Soft Delete CP Actions
    // ---------------------------------------------------
    await DB_Insert(sql`
      UPDATE ${sql.identifier(Tables.TBL_CP_ACTIONS)}
      SET active = FALSE
      WHERE gap_analysis_id = ${gapAnalysisId}
    `);

    // ---------------------------------------------------
    // 2. Soft Delete GAP Analysis
    // ---------------------------------------------------
    await DB_Insert(sql`
      UPDATE ${sql.identifier(Tables.TBL_GAP_ANALYSIS)}
      SET active = FALSE
      WHERE id = ${gapAnalysisId}
    `);

    return JsonResponse.success(
      { id: gapAnalysisId },
      "The CAPA record has been deleted successfully."
    );

  } catch (error) {
    console.error("[CAPA DELETE] Error:", error);
    return JsonResponse.error("Error occurred when deleting CAPA data.");
  }
}
