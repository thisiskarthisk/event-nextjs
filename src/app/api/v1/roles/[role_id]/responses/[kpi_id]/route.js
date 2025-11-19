import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req, context) {
  const { role_id, kpi_id } = await context.params;

  const result = await DB_Fetch(`
    SELECT 
      ${Tables.TBL_KPIS}.id,
      ${Tables.TBL_KPIS}.chart_type,
      ${Tables.TBL_KPIS}.frequency
    FROM 
      ${Tables.TBL_KPIS}
    WHERE ${Tables.TBL_KPIS}.id = ${kpi_id}
      AND ${Tables.TBL_KPIS}.active = TRUE
  `);

  let message = "Fetch KPI Details Details Successfully !";

  return JsonResponse.success({
    kpi_details: result,
  }, message);
}