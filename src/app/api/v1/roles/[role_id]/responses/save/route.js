import { DB_Insert, DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const data = await req.json();
    const { user_id, kpi_role_id, chartType, ucl, lcl, kpi_record_id, chartData, frequency } = data;

    let { periodDate } = data;
    let result, kpi_response_id;

    if (frequency === 'weekly') {
      const { month, week } = periodDate;
      periodDate = `${month}-${week}W`;
    }
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
        AND user_id = ${user_id}
        AND period_date = ${periodDate}
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
          period_date = ${periodDate},
          ucl = ${ucl ?? null},
          lcl = ${lcl ?? null}
        WHERE 
          kpi_id = ${kpi_record_id}
          AND user_id = ${user_id}
      `);
      /* --------------------------------------------
      * Delete The Already exisit KPI Chart Details
      * Abinash
      * --------------------------------------------
      * Modified By Ajay : 12-12-2025
      * If kpi_response already exist then remove chart_data
      * otherwise create a new response  
      */
      await DB_Insert(sql`
        DELETE FROM 
          ${sql.identifier(Tables.TBL_KPI_RESPONSE_CHART_DATA)}
        WHERE 
          kpi_response_id = ${kpi_response_id}
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
          (${kpi_record_id}, ${user_id}, ${periodDate}, ${ucl ?? null}, ${lcl ?? null})
      `);
    }

    

    /* --------------------------------------------
     * Insert the KPI Chart Details
     * Abinash
     * --------------------------------------------
    */
    for (const record of chartData) {
      await DB_Insert(sql`
        INSERT INTO 
          ${sql.identifier(Tables.TBL_KPI_RESPONSE_CHART_DATA)}
          (kpi_response_id, rca_id, gap_analysis_id, label, value, meta,target)
        VALUES
          (${kpi_response_id}, ${null}, ${null}, ${record.label}, ${record.value}, ${null},${(record.target != 0)? record.target:null})
      `);
    }

    return JsonResponse.success({ 'result': result },"The chart data was uploaded successfully!");

  } catch (error) {

    return JsonResponse.error(error.message || "Error saving chart data");
  }
}