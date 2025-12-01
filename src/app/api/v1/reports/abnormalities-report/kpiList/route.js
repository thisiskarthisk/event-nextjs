import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req, context) {
    let user_id = Number(req.nextUrl.searchParams.get("user_id"));
    let where = ``;
    if(user_id){
        where = `AND kr.user_id = ${user_id}`
    }
    const kpiList = await DB_Fetch(`
        SELECT DISTINCT
            kr.kpi_id,
            kpi.name,
            kpi.measurement,
            kpi.frequency,
            kpi.chart_type
        FROM kpi_responses kr
        JOIN kpis kpi ON kr.kpi_id = kpi.id
        WHERE kpi.active = true
        ${where}
    `);

    return JsonResponse.success(kpiList);
}