import { DB_Insert, DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function POST(req) {
  try {
    const data = await req.json();
    const { response_id, rca_id, capa_id, user_id, kpi_id } = data;

    const capId = capa_id ? capa_id : null;
    const rcaId = rca_id ? rca_id : null;

    let result;   
    
    result = await DB_Insert(`
      UPDATE 
        ${Tables.TBL_KPI_RESPONSE_CHART_DATA}
      SET
        rca_id = ${rcaId != null ? rcaId : "NULL"},
        gap_analysis_id = ${capId != null ? capId : "NULL"}
      WHERE
        id = ${response_id}
    `);

    return JsonResponse.success({ 'result': result },"The RCA linked successfully!");

  } catch (error) {

    return JsonResponse.error(error.message || "Error saving chart data");
  }
};
