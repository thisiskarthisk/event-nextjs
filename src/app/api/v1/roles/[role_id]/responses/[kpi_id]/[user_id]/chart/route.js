import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req, context) {
  const { role_id, kpi_id, user_id } = await context.params;

  const searchParams = req.nextUrl.searchParams;
  const filterData = searchParams.get('filterData') || '';
  
  const result = await DB_Fetch(`
    SELECT 
      ${Tables.TBL_KPIS}.chart_type,
      ${Tables.TBL_KPIS}.frequency,
      ${Tables.TBL_KPI_RESPONSES}.id,
      ${Tables.TBL_KPI_RESPONSES}.kpi_id,
      ${Tables.TBL_KPI_RESPONSES}.user_id,
      ${Tables.TBL_KPI_RESPONSES}.period_date,
      ${Tables.TBL_KPI_RESPONSES}.ucl,
      ${Tables.TBL_KPI_RESPONSES}.lcl,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'response_id', ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.id,
          'label', ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.label,
          'value', ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.value,
          'rca_id', ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.rca_id,
          'gap_analysis_id', ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.gap_analysis_id
        )
        ORDER BY ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.id
      ) AS chart_data
    FROM 
      ${Tables.TBL_KPI_RESPONSES}
    JOIN ${Tables.TBL_KPIS}
      ON ${Tables.TBL_KPIS}.id = ${Tables.TBL_KPI_RESPONSES}.kpi_id
      AND ${Tables.TBL_KPIS}.active = TRUE
    JOIN ${Tables.TBL_KPI_RESPONSE_CHART_DATA}
      ON ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.kpi_response_id = ${Tables.TBL_KPI_RESPONSES}.id
      AND ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.active = TRUE
    WHERE ${Tables.TBL_KPI_RESPONSES}.kpi_id = ${kpi_id}
      AND ${Tables.TBL_KPI_RESPONSES}.user_id = ${user_id} 
      AND ${Tables.TBL_KPI_RESPONSES}.active = TRUE
      AND ${Tables.TBL_KPI_RESPONSES}.period_date = CASE
        WHEN ${Tables.TBL_KPIS}.frequency = 'daily' THEN CONCAT(COALESCE(NULLIF('${filterData}', ''), '01-01'), '-01')
        WHEN ${Tables.TBL_KPIS}.frequency = 'monthly' THEN NULLIF('${filterData}', '')::TEXT
        WHEN ${Tables.TBL_KPIS}.frequency = 'weekly' THEN NULLIF('${filterData}', '')::TEXT
        ELSE NULL
      END
    GROUP BY 
      ${Tables.TBL_KPIS}.chart_type,
      ${Tables.TBL_KPIS}.frequency,
      ${Tables.TBL_KPI_RESPONSES}.id,
      ${Tables.TBL_KPI_RESPONSES}.kpi_id,
      ${Tables.TBL_KPI_RESPONSES}.user_id,
      ${Tables.TBL_KPI_RESPONSES}.period_date;
  `);

  let message = "Fetch KPI Charts Resposne Details Successfully !";

  return JsonResponse.success({
    kpi_chart_responses: result,
  }, message);
}