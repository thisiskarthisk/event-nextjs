import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req) {
    const userId = req.nextUrl.searchParams.get("user") || "";
    const kpiId = req.nextUrl.searchParams.get("kpi") || "";
    const year = req.nextUrl.searchParams.get("year") || "";
    const exportRecord = req.nextUrl.searchParams.get("export") || false;

    let where = ` WHERE kr.ucl IS NOT NULL
        AND kr.lcl IS NOT NULL
        AND krcd.value IS NOT NULL `;

    if (userId) where += ` AND kr.user_id = ${userId}`;
    if (kpiId) where += ` AND kr.kpi_id = ${kpiId}`;
    if (year) where += ` AND EXTRACT(YEAR FROM
                              CASE
                                  WHEN kr.period_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN
                                      kr.period_date::date
                                  WHEN kr.period_date ~ '^\\d{4}-\\d{2}$' THEN
                                      TO_DATE(kr.period_date || '-01', 'YYYY-MM-DD')
                                  WHEN kr.period_date ~ '^\\d{4}$' THEN
                                      TO_DATE(kr.period_date || '-01-01', 'YYYY-MM-DD')
                              END
                          ) = ${year}`;

    // Step 1: Base monthly aggregation (COUNT instead of AVG)
    const monthlySql = `
        SELECT
        k.name AS kpi_name,
        INITCAP(TRIM(
            CASE
                WHEN k.frequency = 'monthly' THEN
                    krcd.label
                ELSE
                    TO_CHAR(
                        CASE
                            WHEN kr.period_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN
                                kr.period_date::date
                            WHEN kr.period_date ~ '^\\d{4}-\\d{2}$' THEN
                                TO_DATE(kr.period_date || '-01', 'YYYY-MM-DD')
                            WHEN kr.period_date ~ '^\\d{4}$' THEN
                                TO_DATE(kr.period_date || '-01-01', 'YYYY-MM-DD')
                        END,
                        'Mon'
                    )
            END
        )) AS month,

        COUNT(krcd.value) AS value

    FROM ${Tables.TBL_KPIS} k
    JOIN ${Tables.TBL_KPI_RESPONSES} kr
        ON k.id = kr.kpi_id
    JOIN ${Tables.TBL_KPI_RESPONSE_CHART_DATA} krcd
        ON kr.id = krcd.kpi_response_id

    ${where}    
        AND krcd.value NOT BETWEEN kr.lcl AND kr.ucl

    GROUP BY
        k.name,
        k.frequency,
        INITCAP(TRIM(
            CASE
                WHEN k.frequency = 'monthly' THEN krcd.label
                ELSE
                    TO_CHAR(
                        CASE
                            WHEN kr.period_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN kr.period_date::date
                            WHEN kr.period_date ~ '^\\d{4}-\\d{2}$' THEN TO_DATE(kr.period_date || '-01', 'YYYY-MM-DD')
                            WHEN kr.period_date ~ '^\\d{4}$' THEN TO_DATE(kr.period_date || '-01-01', 'YYYY-MM-DD')
                        END,
                        'Mon'
                    )
            END
        ))
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
