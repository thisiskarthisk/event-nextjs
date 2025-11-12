import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(request, { params }) {
  try {
    const { role_id, rs_id } = params;

    if (!role_id) return JsonResponse.error("Missing role_id", 400);
    if (!rs_id) return JsonResponse.error("Missing rs_id", 400);

    /* Fetch the objective (role_objective) by rs_id */
    const objectives = await DB_Fetch(sql`
      SELECT id, name AS objective, description
      FROM ${sql.identifier(Tables.TBL_ROLE_OBJECTIVES)}
      WHERE role_id = ${role_id}
        AND id = ${rs_id}
        AND active = TRUE
      ORDER BY id ASC
    `);

    if (!objectives?.length) {
      return JsonResponse.success({ roleSheet: [] }, "No objectives found for this role");
    }

    /* Fetch Role Sheets for this objective */
    const sheets = await DB_Fetch(sql`
      SELECT id, role_objective_id, title AS role, description
      FROM ${sql.identifier(Tables.TBL_ROLE_SHEET)}
      WHERE role_objective_id = ${rs_id}
      ORDER BY id ASC
    `);

    /* Fetch KPIs for those sheets (safe sql.join usage) */
    const sheetIds = sheets.map((s) => s.id);

    let kpis = [];
    if (sheetIds.length) {
      /* Build a safe list of SQL fragments for each id */
      const sqlFragments = sheetIds.map((id) => sql`${id}`);
      kpis = await DB_Fetch(sql`
        SELECT
          id,
          role_sheet_id,
          name AS kpi,
          measurement AS measure,
          op_definition AS operation_definition,
          frequency AS frequency_of_measurement,
          chart_type AS vcs
        FROM ${sql.identifier(Tables.TBL_KPIS)}
        WHERE role_sheet_id IN (${sql.join(sqlFragments, sql`,`)})
        ORDER BY id ASC
      `);
    }

    /* Group KPIs under each Role Sheet */
    const sheetsWithKpis = sheets.map((sheet) => ({
      id: sheet.id,
      role_objective_id: sheet.role_objective_id,
      role: sheet.role,
      description: sheet.description,
      kpis: kpis
        .filter((kpi) => String(kpi.role_sheet_id) === String(sheet.id))
        .map((kpi) => ({
          id: kpi.id,
          kpi: kpi.kpi,
          measure: kpi.measure,
          operation_definition: kpi.operation_definition,
          frequency_of_measurement: kpi.frequency_of_measurement,
          vcs: kpi.vcs,
        })),
    }));

    /* Group Role Sheets under Objective */
    const roleSheet = objectives.map((obj) => ({
      id: obj.id,
      objective: obj.objective,
      description: obj.description,
      roles: sheetsWithKpis.filter((sheet) => String(sheet.role_objective_id) === String(obj.id)),
    }));

    return JsonResponse.success({ roleSheet }, "Role sheet fetched successfully");
  } catch (error) {
    console.error("[api/v1/roles/[role_id]/rs/[rs_id]] GET Error:", error);
    return JsonResponse.error("Failed to fetch role sheet", 500);
  }
}
