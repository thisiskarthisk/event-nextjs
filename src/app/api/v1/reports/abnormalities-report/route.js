import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req) {
    let page = Number(req.nextUrl.searchParams.get("page")) || 1;
    let pageSize = Number(req.nextUrl.searchParams.get("pageSize")) || 10;

    const kpi = req.nextUrl.searchParams.get("kpi") || "";
    const startDate = req.nextUrl.searchParams.get("startDate") || "";
    const endDate = req.nextUrl.searchParams.get("endDate") || "";
    const searchValue = req.nextUrl.searchParams.get("search");
    const userId = req.nextUrl.searchParams.get("user");
    const exportRecord = req.nextUrl.searchParams.get("export") || false;
    const offset = (page - 1) * pageSize;
    let where = " WHERE kr.ucl IS NOT NULL AND kr.lcl IS NOT NULL ";
    let pagination = `LIMIT ${pageSize} OFFSET ${offset}`;
    if (kpi) where += ` AND k.id = ${kpi}`;
    if (startDate) where += ` AND kr.period_date >= '${startDate}'::date `;
    if (endDate) where += ` AND kr.period_date <= '${endDate}'::date `;
    if (userId) where += ` AND kr.user_id = '${userId}'`;
    
    if (exportRecord) pagination = ``;


    // GLOBAL SEARCH
    if (searchValue) {
        const safeSearch = searchValue.replace(/'/g, "''");
        where += `
            AND (
                k.name ILIKE '%${safeSearch}%'
                OR krcd.label ILIKE '%${safeSearch}%'
                OR CAST(krcd.value AS TEXT) ILIKE '%${safeSearch}%'
                OR CAST(kr.period_date AS TEXT) ILIKE '%${safeSearch}%'
                OR CAST(kr.ucl AS TEXT) ILIKE '%${safeSearch}%'
                OR CAST(kr.lcl AS TEXT) ILIKE '%${safeSearch}%'
            )
        `;
    }

    let sql = `
        SELECT 
            *,
            COUNT(*) OVER() AS total_records
        FROM (
            SELECT
                kr.kpi_id,
                kr.user_id,
                kr.period_date, 
                k.name,
                kr.ucl,
                kr.lcl,
                krcd.label,
                ROUND(krcd.value::numeric, 2) AS value,
                CASE
                    WHEN krcd.value < kr.lcl THEN 'lower'
                    WHEN krcd.value < kr.ucl THEN 'boundary'
                    ELSE 'upper'
                END AS type,
                CASE
                    WHEN krcd.value < kr.lcl THEN CONCAT('LAL:', (kr.lcl)::INT)
                    WHEN krcd.value < kr.ucl THEN 'boundary'
                    ELSE CONCAT('UAL:', (kr.ucl)::INT)
                END AS limit
            FROM ${Tables.TBL_KPIS} k
            LEFT JOIN ${Tables.TBL_KPI_RESPONSE} kr ON k.id = kr.kpi_id
            LEFT JOIN ${Tables.TBL_KPI_RESPONSE_CHART_DATA} krcd ON kr.id = krcd.kpi_response_id 
            ${where}
        ) t
        WHERE t.type != 'boundary'
        ORDER BY t.label
        ${pagination};
    `;

    const rows = await DB_Fetch(sql);

    const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;

    const totalPages = Math.ceil(totalRecords / pageSize);

    return JsonResponse.success({
        row: rows,
        total: totalRecords,
        page: page,
        pageSize: pageSize,
        filtered: totalRecords,
        totalPages: totalPages,
    });
}
