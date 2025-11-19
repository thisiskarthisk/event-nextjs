import { DB_Insert } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";


export async function DELETE(req, context) {
    try {
        const { id } = await context.params;

        const RCAId = Number(id);

        // Delete rca_whys
        await DB_Insert(sql`
            DELETE FROM rca_whys WHERE rca_id=${RCAId}
        `);

        // Delete root_cause_analysis
        await DB_Insert(sql`
            DELETE FROM root_cause_analysis WHERE id=${RCAId}
        `);

        return JsonResponse.success(
            { RCA_Id: RCAId },
            "The RCA record has been deleted successfully."
        );

    } catch (error) {
        console.error("[api/delete/[id]] Error:", error);
        return JsonResponse.error("Error occurred when trying to delete RCA data.");
    }
}