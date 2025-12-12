import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req) {
    const userId = req.nextUrl.searchParams.get("user") || "";
    const kpiId = req.nextUrl.searchParams.get("kpi") || "";
    const year = req.nextUrl.searchParams.get("year") || "";
    const exportRecord = req.nextUrl.searchParams.get("export") || false;

    let where = ` WHERE kr.ucl IS NOT NULL AND kr.lcl IS NOT NULL `;

    if (userId) where += ` AND kr.user_id = ${userId}`;
    if (kpiId) where += ` AND kr.kpi_id = ${kpiId}`;
    if (year) where += ` AND EXTRACT(YEAR FROM
                            CASE
                                WHEN kr.period_date ~ '^\\d{4}$' THEN
                                    TO_DATE(kr.period_date || '-01-01', 'YYYY-MM-DD')
                                WHEN kr.period_date ~ '^\\d{4}-\\d{2}-[1-5]W$' THEN
                                    TO_DATE(
                                        SUBSTRING(kr.period_date, 1, 8) ||
                                        ((CAST(SUBSTRING(kr.period_date, 9, 1) AS INT) - 1) * 7 + 1),
                                        'YYYY-MM-DD'
                                    )
                                ELSE
                                    kr.period_date::date
                            END
                        ) = ${year}`;

    // Step 1: Base monthly aggregation (COUNT instead of AVG)
    const monthlySql = `
        SELECT
            k.name AS kpi_name,
            CASE
                WHEN k.frequency = 'monthly' THEN
                    krcd.label
                ELSE
                    TO_CHAR(
                        CASE
                            WHEN kr.period_date ~ '^\\d{4}$' THEN
                                TO_DATE(kr.period_date || '-01-01', 'YYYY-MM-DD')
                            WHEN kr.period_date ~ '^\\d{4}-\\d{2}-[1-5]W$' THEN
                                TO_DATE(
                                    SUBSTRING(kr.period_date, 1, 8) ||
                                    ((CAST(SUBSTRING(kr.period_date, 9, 1) AS INT) - 1) * 7 + 1),
                                    'YYYY-MM-DD'
                                )
                            ELSE
                                kr.period_date::date
                        END,
                        'Mon'
                    )
            END AS month,
             CASE
                WHEN k.frequency = 'monthly' THEN
                    COUNT(krcd.value)                 -- group by chart_data label
                ELSE
                    COUNT(krcd.value)                 -- normal behavior
            END AS value

        FROM ${Tables.TBL_KPIS} k
        LEFT JOIN ${Tables.TBL_KPI_RESPONSE} kr ON k.id = kr.kpi_id
        LEFT JOIN ${Tables.TBL_KPI_RESPONSE_CHART_DATA} krcd ON kr.id = krcd.kpi_response_id
        ${where}
        AND krcd.value IS NOT NULL
        AND (krcd.value NOT BETWEEN kr.lcl AND kr.ucl)

        GROUP BY 
            k.name, 
            month,
            k.frequency
        HAVING COUNT(krcd.value) > 0
    `;

    const monthRows = await DB_Fetch(monthlySql);

    if (monthRows.length === 0) {
        return JsonResponse.success({ row: [] });
    }

    // Step 2: Pivot → KPI rows with 12 month columns
    const pivotSql = `
        SELECT
            kpi_name,
            MAX(value) FILTER (WHERE month = 'Jan') AS "Jan",
            MAX(value) FILTER (WHERE month = 'Feb') AS "Feb",
            MAX(value) FILTER (WHERE month = 'Mar') AS "Mar",
            MAX(value) FILTER (WHERE month = 'Apr') AS "Apr",
            MAX(value) FILTER (WHERE month = 'May') AS "May",
            MAX(value) FILTER (WHERE month = 'Jun') AS "Jun",
            MAX(value) FILTER (WHERE month = 'Jul') AS "Jul",
            MAX(value) FILTER (WHERE month = 'Aug') AS "Aug",
            MAX(value) FILTER (WHERE month = 'Sep') AS "Sep",
            MAX(value) FILTER (WHERE month = 'Oct') AS "Oct",
            MAX(value) FILTER (WHERE month = 'Nov') AS "Nov",
            MAX(value) FILTER (WHERE month = 'Dec') AS "Dec"
        FROM (${monthlySql}) m
        GROUP BY kpi_name
        ORDER BY kpi_name;
    `;

    const pivotRows = await DB_Fetch(pivotSql);

    return JsonResponse.success({
        row: pivotRows,
        total: pivotRows.length
    });
}
