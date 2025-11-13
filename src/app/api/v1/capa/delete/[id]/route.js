import { DB_Insert } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";


export async function DELETE(req, context) {
    try {
        const { id } = await context.params;

        const gapAnalysisId = Number(id);

        // Delete cp_actions
        await DB_Insert(sql`
            DELETE FROM cp_actions WHERE gap_analysis_id=${gapAnalysisId}
        `);

        // Delete gap_analysis
        await DB_Insert(sql`
            DELETE FROM gap_analysis WHERE id=${gapAnalysisId}
        `);

        return JsonResponse.success(
            { gap_analysis_id: gapAnalysisId },
            "The CAPA record has been deleted successfully."
        );

    } catch (error) {
        console.error("[api/capa/[id]] Error:", error);
        return JsonResponse.error("Error occurred when trying to delete CAPA data.");
    }
}