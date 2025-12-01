import { DB_Fetch, DB_Insert , Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req, context) {
    const data = await context.params;

    const root_cause_analysis = await DB_Fetch(`
        SELECT
            *
        FROM
            root_cause_analysis
        WHERE id = ${data.id}
        AND active = TRUE;
    `);

    const rca_whys = await DB_Fetch(`
        SELECT
            *
        FROM
            rca_whys
        WHERE rca_id = ${data.id}
        AND active = TRUE;
    `);

    return JsonResponse.success({
        'root_cause_analysis': root_cause_analysis[0] || [],
        'rca_whys': rca_whys,
    });
}
