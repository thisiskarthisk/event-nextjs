import { DB_Fetch, DB_Insert , Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req, context) {
    const id = req.nextUrl.searchParams.get("id");
    const chartData = await DB_Fetch(`
        SELECT
            *
        FROM
            kpi_response_chart_data
        WHERE id = ${id}
        AND active = TRUE;
    `);
    
    return JsonResponse.success({
        'responseChartData': chartData[0] || [],
    });
}
