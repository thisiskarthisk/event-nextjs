import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req, context) {

  const { role_id } = await context.params;
  const user_id = req.nextUrl.searchParams.get('user_id');
  
  const result = await DB_Fetch(`
    SELECT 
      ${Tables.TBL_ROLE_OBJECTIVES}.name AS Objective, 
      ${Tables.TBL_ROLE_SHEETS}.title AS Role,
      ${Tables.TBL_KPIS}.id::INTEGER AS KPIs_id,
      ${Tables.TBL_KPIS}.name AS KPI,
      ${Tables.TBL_KPIS}.measurement,
      ${Tables.TBL_KPIS}.op_definition,
      ${Tables.TBL_KPIS}.frequency,
      ${Tables.TBL_KPIS}.chart_type,
      chart_data_sub.chart_data
    FROM
      ${Tables.TBL_ROLE_OBJECTIVES}
    LEFT JOIN ${Tables.TBL_ROLE_SHEETS}
      ON ${Tables.TBL_ROLE_SHEETS}.role_objective_id = ${Tables.TBL_ROLE_OBJECTIVES}.id 
      AND ${Tables.TBL_ROLE_SHEETS}.active = TRUE
    LEFT JOIN ${Tables.TBL_KPIS}
      ON ${Tables.TBL_KPIS}.role_sheet_id = ${Tables.TBL_ROLE_SHEETS}.id 
      AND ${Tables.TBL_KPIS}.active = TRUE

    
    /* chart data aggregation */
    LEFT JOIN (
      SELECT
        ${Tables.TBL_KPI_RESPONSES}.kpi_id,
        ${Tables.TBL_KPI_RESPONSES}.period_date,
        ${Tables.TBL_KPI_RESPONSES}.ucl,
        ${Tables.TBL_KPI_RESPONSES}.lcl,
        CASE 
          WHEN COUNT(${Tables.TBL_KPI_RESPONSE_CHART_DATA}.id) > 0 THEN 
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'response_id', ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.id,
                'label', ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.label,
                'value', ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.value
              )
            )
          ELSE NULL
        END AS chart_data
      FROM 
        ${Tables.TBL_KPI_RESPONSES}
      LEFT JOIN ${Tables.TBL_KPI_RESPONSE_CHART_DATA} 
        ON ${Tables.TBL_KPI_RESPONSE_CHART_DATA}.kpi_response_id = ${Tables.TBL_KPI_RESPONSES}.id
      WHERE 
        ${Tables.TBL_KPI_RESPONSES}.user_id = ${user_id}
        AND ${Tables.TBL_KPI_RESPONSES}.active = TRUE
      GROUP BY 
        ${Tables.TBL_KPI_RESPONSES}.kpi_id,
        ${Tables.TBL_KPI_RESPONSES}.period_date,
        ${Tables.TBL_KPI_RESPONSES}.ucl,
        ${Tables.TBL_KPI_RESPONSES}.lcl
    ) AS chart_data_sub 
      ON chart_data_sub.kpi_id = ${Tables.TBL_KPIS}.id
    

    INNER JOIN ${Tables.TBL_ROLE_USERS} /* Left Join Change To Inner Join */
      ON ${Tables.TBL_ROLE_USERS}.role_id = ${role_id}
      AND ${Tables.TBL_ROLE_USERS}.active = TRUE
      AND ${Tables.TBL_ROLE_USERS}.user_id = ${user_id}
      
    
    WHERE
      ${Tables.TBL_ROLE_OBJECTIVES}.role_id = ${role_id}  /* New Line Added */
    AND
      ${Tables.TBL_ROLE_OBJECTIVES}.active = TRUE
    ORDER BY 
      ${Tables.TBL_KPIS}.id;
  `);
   
  let message = "Fetch KPI Resposne Details Successfully !";

  console.log("Fetched KPI responses for role_id:", role_id, result);
  return JsonResponse.success({
    kpi_responses: result,
  }, message);
}




// Working Code Below
// import { DB_Fetch, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function GET(req, context) {

//   const { role_id } = await context.params;
//   const user_id = req.nextUrl.searchParams.get('user_id');
  
//   const result = await DB_Fetch(
//     `
//       SELECT 
//         ro.name AS objective,
//         rs.title AS role,
//         k.id::INTEGER AS kpis_id,
//         k.name AS kpi,
//         k.measurement,
//         k.op_definition,
//         k.frequency,
//         k.chart_type,
//         chart_data_sub.chart_data
//       FROM ${Tables.TBL_ROLE_OBJECTIVES} ro
//       LEFT JOIN ${Tables.TBL_ROLE_SHEETS} rs
//         ON rs.role_objective_id = ro.id 
//         AND rs.active = TRUE
//       LEFT JOIN ${Tables.TBL_KPIS} k
//         ON k.role_sheet_id = rs.id 
//         AND k.active = TRUE

//       /* FIXED JOIN: ensure this role belongs to this user */
//       INNER JOIN ${Tables.TBL_ROLE_USERS} ru
//         ON ru.role_id = ro.role_id
//         AND ru.user_id = ${user_id}
//         AND ru.active = TRUE

//       /* chart data aggregation */
//       LEFT JOIN (
//         SELECT
//           kr.kpi_id,
//           kr.period_date,
//           kr.ucl,
//           kr.lcl,
//           CASE 
//             WHEN COUNT(krc.id) > 0 THEN 
//               JSON_AGG(
//                 JSON_BUILD_OBJECT(
//                   'response_id', krc.id,
//                   'label', krc.label,
//                   'value', krc.value
//                 )
//               )
//             ELSE NULL
//           END AS chart_data
//         FROM ${Tables.TBL_KPI_RESPONSES} kr
//         LEFT JOIN ${Tables.TBL_KPI_RESPONSE_CHART_DATA} krc
//           ON krc.kpi_response_id = kr.id
//         WHERE 
//           kr.user_id = ${user_id}
//           AND kr.active = TRUE
//         GROUP BY kr.kpi_id, kr.period_date, kr.ucl, kr.lcl
//       ) AS chart_data_sub 
//         ON chart_data_sub.kpi_id = k.id

//       WHERE
//         ro.role_id = ${role_id}
//         AND ro.active = TRUE
//       ORDER BY k.id
//     `,
//   );

   
//   let message = "Fetch KPI Resposne Details Successfully !";

//   console.log("Fetched KPI responses for role_id:", role_id, result);
//   return JsonResponse.success({
//     kpi_responses: result,
//   }, message);
// }
