import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req, context) {
    const kpi = req.nextUrl.searchParams.get("kpi");
    const startDate = req.nextUrl.searchParams.get("startDate");
    const endDate = req.nextUrl.searchParams.get("endDate");
    console.log(kpi,startDate,endDate);
    let where = "";
    if(kpi != ""){
        where += " AND k.id = "+kpi;
    }
    if(startDate != ""){
        where += " AND kr.period_date >='"+startDate+"'::date";
    }
    if(endDate != ""){
        where += " AND kr.period_date <='"+endDate+"'::date";
    }
    console.log(where);
    let sql = "SELECT *\
        FROM (\
            SELECT \
                k.name,\
                kr.ucl,\
                kr.lcl,\
                krcd.label,\
                krcd.value,\
                CASE\
                    WHEN krcd.value < kr.lcl THEN 'lower'\
                    WHEN krcd.value < kr.ucl THEN 'boundary'\
                    ELSE 'upper'\
                END AS type,\
                CASE\
                    WHEN krcd.value < kr.lcl THEN CONCAT('LAL:',(kr.lcl)::INT)\
                    WHEN krcd.value < kr.ucl THEN 'boundary'\
                    ELSE CONCAT('UAL:',(kr.ucl)::INT)\
                END AS limit\
            FROM kpis k\
            LEFT JOIN kpi_responses kr \
                ON k.id = kr.kpi_id\
            LEFT JOIN kpi_response_chart_data krcd \
                ON kr.id = krcd.kpi_response_id \
            WHERE kr.ucl IS NOT NULL\
            AND kr.lcl IS NOT NULL\
            "+where+"\
        ) t\
        WHERE t.type != 'boundary';\
    ";
    console.log("Condition: "+where);
    const result = await DB_Fetch(sql);

    const kpiList = await DB_Fetch(`
        SELECT
            id,
            name
        FROM kpis
        WHERE active = true
    `);
    console.log(JsonResponse.success({
    'data': result,
    'kpiList': kpiList,
  }));
  return JsonResponse.success({
    'data': result,
    'kpiList': kpiList,
  });
}