import { DB_Fetch, DB_Insert } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req, context) {
    const data = await context.params;

    const result = await DB_Fetch(`
        SELECT
            ga.id AS ga_id,
            cpa.id AS cpa_id,
            ga.*,
            cpa.*
        FROM
            gap_analysis ga
        LEFT JOIN cp_actions cpa
        ON ga.id = cpa.gap_analysis_id
        WHERE ga.id = ${data.id};
    `);

    return JsonResponse.success({
        'gap_analysis': result,
    });
}

// Delete cp_actions record
export async function DELETE(req, context) {
    try {
        const { id } = await context.params;

        const cpActionId = Number(id);

        // Delete cp_actions
        await DB_Insert(sql`
            DELETE FROM cp_actions WHERE id=${cpActionId}
        `);

        return JsonResponse.success(
            { cpActionId: cpActionId },
            "The CAPA action record has been deleted successfully."
        );

    } catch (error) {
        console.error("[api/capa/[id]] Error:", error);
        return JsonResponse.error("Error occurred when trying to delete CAPA record.");
    }
}