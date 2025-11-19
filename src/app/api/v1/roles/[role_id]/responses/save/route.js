import { DB_Insert, DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const data = await req.json();
    const { user_id, kpi_role_id, chartType, ucl, lcl, kpi_record_id, chartData, periodDate } = data;
   
    let result, kpi_response_id;
    
    /* --------------------------------------------
     * Fetching KPI Details
     * Abinash
     * --------------------------------------------
    */
    const existingRecord = await DB_Fetch(sql`
      SELECT 
        id 
      FROM 
        ${sql.identifier(Tables.TBL_KPI_RESPONSES)}
      WHERE 
        kpi_id = ${kpi_record_id}
    `);

    /* --------------------------------------------
     * Check If Already Exisiting Records
     * Abinash
     * --------------------------------------------
    */
    if (existingRecord?.length > 0) {
      kpi_response_id = await DB_Insert(sql`
        UPDATE 
          ${sql.identifier(Tables.TBL_KPI_RESPONSES)}
        SET
          user_id = ${user_id ?? null},
          period_date = ${periodDate},
          ucl = ${ucl ?? null},
          lcl = ${lcl ?? null}
        WHERE 
          kpi_id = ${kpi_record_id}
      `);
    } else {
      /* --------------------------------------------
      * Insert The New KPI Records
      * Abinash
      * --------------------------------------------
      */
      kpi_response_id = await DB_Insert(sql`
        INSERT INTO 
          ${sql.identifier(Tables.TBL_KPI_RESPONSES)}
          (kpi_id, user_id, period_date, ucl, lcl)
        VALUES
          (${kpi_record_id}, ${user_id ?? null}, ${periodDate}, ${ucl ?? null}, ${lcl ?? null})
      `);
    }

    /* --------------------------------------------
     * Delete The Already exisit KPI Chart Details
     * Abinash
     * --------------------------------------------
    */
    await DB_Insert(sql`
      DELETE FROM 
        ${sql.identifier(Tables.TBL_KPI_RESPONSE_CHART_DATA)}
      WHERE 
        kpi_response_id = ${kpi_response_id}
    `);

    /* --------------------------------------------
     * Insert the KPI Chart Details
     * Abinash
     * --------------------------------------------
    */
    for (const record of chartData) {
      await DB_Insert(sql`
        INSERT INTO 
          ${sql.identifier(Tables.TBL_KPI_RESPONSE_CHART_DATA)}
          (kpi_response_id, rca_id, gap_analysis_id, label, value, meta)
        VALUES
          (${kpi_response_id}, ${null}, ${null}, ${record.label}, ${record.value}, ${null})
      `);
    }

    return JsonResponse.success({ 'result': result },"The chart data was uploaded successfully!");

  } catch (error) {

    return JsonResponse.error(error.message || "Error saving chart data");
  }
}