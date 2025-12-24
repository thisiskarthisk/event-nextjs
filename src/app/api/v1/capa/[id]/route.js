import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req, context) {
    try{
        const data = await context.params;
        const capaId = data.id;
        const result = await DB_Fetch(sql`
            SELECT
                ga.id AS ga_id,
                cpa.id AS cpa_id,
                ga.*,
                cpa.*,
                CASE
                    WHEN cpa.cor_action_responsibility IS NULL THEN NULL
                    ELSE CONCAT(u_cor.first_name, ' ', u_cor.last_name)
                END AS cor_responsibility_user,
                CASE
                    WHEN cpa.prev_action_responsibility IS NULL THEN NULL
                    ELSE CONCAT(u_prev.first_name, ' ', u_prev.last_name)
                END AS prev_responsibility_user
            FROM
                ${sql.identifier(Tables.TBL_GAP_ANALYSIS)} ga

            LEFT JOIN ${sql.identifier(Tables.TBL_CP_ACTIONS)} cpa
            ON ga.id = cpa.gap_analysis_id

            LEFT JOIN ${sql.identifier(Tables.TBL_USERS)} u_cor
                ON u_cor.id = cpa.cor_action_responsibility

            LEFT JOIN ${sql.identifier(Tables.TBL_USERS)} u_prev
                ON u_prev.id = cpa.prev_action_responsibility
            WHERE ga.id = ${capaId};
        `);

        return JsonResponse.success({
            'gap_analysis': result,
        });
    }catch(e){
        console.error("[api/capa/[id]] Error:", e);
        return JsonResponse.error("Error occurred when trying to GET CAPA record.");
    }
    
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