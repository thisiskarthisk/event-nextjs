import { DB_Insert, DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req, contextPromise) {
  try {
    const { params } = await contextPromise;
    const { role_id } = params;
    const body = await req.json();
    const { data } = body;

    if (!role_id || !data || !Array.isArray(data)) {
      return JsonResponse.error("Invalid payload", 400);
    }

    const existingObjectives = await DB_Fetch(sql`
      SELECT name FROM ${sql.identifier(Tables.TBL_ROLE_OBJECTIVES)}
      WHERE role_id = ${role_id}
    `);
    const existingObjectiveNames = new Set(existingObjectives.map(o => o.name));

    for (const objective of data) {
      if (existingObjectiveNames.has(objective.objective)) {
        return JsonResponse.error(`Objective "${objective.objective}" already exists in DB!`, 400);
      }
    }

    let insertedCount = { objectives: 0, sheets: 0, kpis: 0 };

    for (const objective of data) {
      
      /* Insert or Skip Objective */
      await DB_Insert(sql`
        INSERT INTO ${sql.identifier(Tables.TBL_ROLE_OBJECTIVES)}
          (role_id, name, description)
        VALUES
          (${role_id}, ${objective.objective}, ${objective.objective})
        ON CONFLICT (role_id, name) DO NOTHING
      `);

      /* Fetch objective id (works safely) */
      const existingObjective = await DB_Fetch(sql`
        SELECT id FROM ${sql.identifier(Tables.TBL_ROLE_OBJECTIVES)}
        WHERE role_id = ${role_id} AND name = ${objective.objective}
        LIMIT 1
      `);

      const role_objective_id = existingObjective?.[0]?.id;
      if (!role_objective_id) continue;

      insertedCount.objectives++;

      /* Insert Role Sheets */
      for (const role of objective.roles || []) {
        await DB_Insert(sql`
          INSERT INTO ${sql.identifier(Tables.TBL_ROLE_SHEETS)}
            (role_objective_id, title, description)
          VALUES
            (${role_objective_id}, ${role.role}, ${role.description || role.role})
          ON CONFLICT (role_objective_id, title) DO NOTHING
        `);

        /* Fetch sheet id properly */
        const existingSheet = await DB_Fetch(sql`
          SELECT id FROM ${sql.identifier(Tables.TBL_ROLE_SHEETS)}
          WHERE role_objective_id = ${role_objective_id} AND title = ${role.role}
          LIMIT 1
        `);

        const role_sheet_id = existingSheet?.[0]?.id;
        if (!role_sheet_id) continue;

        insertedCount.sheets++;

        /* Insert KPIs */
        for (const kpi of role.kpis || []) {
          await DB_Insert(sql`
            INSERT INTO ${sql.identifier(Tables.TBL_KPIS)}
              (role_sheet_id, name, measurement, op_definition, frequency, chart_type)
            VALUES
              (
                ${role_sheet_id},
                ${kpi.kpi},
                ${kpi.measure},
                ${kpi.operation_definition},
                ${kpi.frequency_of_measurement || null},
                ${kpi.vcs || null}
              )
            ON CONFLICT (role_sheet_id, name) DO NOTHING
          `);

          const existingKpi = await DB_Fetch(sql`
            SELECT id FROM ${sql.identifier(Tables.TBL_KPIS)}
            WHERE role_sheet_id = ${role_sheet_id} AND name = ${kpi.kpi}
            LIMIT 1
          `);

          const kpi_id = existingKpi?.[0]?.id;
          if (kpi_id) {
            insertedCount.kpis++;
            console.log("✅ KPI created:", kpi.kpi, "→", kpi_id);
          }
        }
      }
    }

    return JsonResponse.success(insertedCount, "Role Sheet data saved successfully.");
  } catch (error) {
    console.error("[api/v1/roles/[role_id]/rs/add] Error:", error);
    return JsonResponse.error("Error while saving Role Sheet data", 500);
  }
}
