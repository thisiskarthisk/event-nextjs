import { DB_Fetch, DB_Insert } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req, context) {
    const data = await context.params;

    const root_cause_analysis = await DB_Fetch(`
        SELECT
            *
        FROM
            root_cause_analysis
        WHERE id = ${data.id};
    `);

    const rca_whys = await DB_Fetch(`
        SELECT
            *
        FROM
            rca_whys
        WHERE rca_id = ${data.id};
    `);

    return JsonResponse.success({
        'root_cause_analysis': root_cause_analysis[0] || [],
        'rca_whys': rca_whys,
    });
}

// Delete cp_actions record
export async function DELETE(req, context) {
    try {
        const { id } = await context.params;

        const rcaWhysId = Number(id);

        console.log("cp actions->", rcaWhysId);

        // Delete cp_actions
        await DB_Insert(sql`
            DELETE FROM rca_whys WHERE id=${rcaWhysId}
        `);

        return JsonResponse.success(
            { rca_why_id: rcaWhysId },
            "The RCA question has been deleted successfully."
        );

    } catch (error) {
        console.error("[api/rca/[id]] Error:", error);
        return JsonResponse.error("Error occurred when trying to delete RCA record.");
    }
}