import { DB_Insert, DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function PUT(req, contextPromise) {
  try {
    const { params } = await contextPromise;
    const { role_id } = params;
    const body = await req.json();
    const { data } = body;

    if (!role_id || !data || !Array.isArray(data)) {
      return JsonResponse.error("Invalid payload", 400);
    }

    let updatedCount = { objectives: 0, sheets: 0, kpis: 0 };

    for (const objective of data) {
      if (!objective?.objective) continue;

      /* Check if objective exists */
      const existingObjective = await DB_Fetch(sql`
        SELECT id FROM ${sql.identifier(Tables.TBL_ROLE_OBJECTIVES)}
        WHERE id = ${objective.id || null} AND role_id = ${role_id}
        LIMIT 1
      `);

      let role_objective_id = existingObjective?.[0]?.id;

      if (role_objective_id) {
        /* Update existing objective */
        await DB_Insert(sql`
          UPDATE ${sql.identifier(Tables.TBL_ROLE_OBJECTIVES)}
          SET name = ${objective.objective},
              description = ${objective.description || objective.objective},
              updated_at = NOW()
          WHERE id = ${role_objective_id}
        `);
      } else {
        /* Insert new objective */
        const insertedObj = await DB_Fetch(sql`
          INSERT INTO ${sql.identifier(Tables.TBL_ROLE_OBJECTIVES)}
            (role_id, name, description)
          VALUES
            (${role_id}, ${objective.objective}, ${objective.description || objective.objective})
          RETURNING id
        `);
        role_objective_id = insertedObj?.[0]?.id;
      }

      updatedCount.objectives++;

      // === Handle Role Sheets ===
      for (const role of objective.roles || []) {
        if (!role?.role) continue;

        let sheet_id = role.id;

        /* Check if existing sheet */
        let existingSheet = [];
        if (sheet_id) {
          existingSheet = await DB_Fetch(sql`
            SELECT id FROM ${sql.identifier(Tables.TBL_ROLE_SHEETS)}
            WHERE id = ${sheet_id} AND role_objective_id = ${role_objective_id}
            LIMIT 1
          `);
        }

        if (existingSheet?.length) {
          /* Update sheet */
          await DB_Insert(sql`
            UPDATE ${sql.identifier(Tables.TBL_ROLE_SHEETS)}
            SET title = ${role.role},
                description = ${role.description || role.role},
                updated_at = NOW()
            WHERE id = ${sheet_id}
          `);
        } else {
          /* Insert new sheet and fetch its id */
          const insertedSheet = await DB_Fetch(sql`
            INSERT INTO ${sql.identifier(Tables.TBL_ROLE_SHEETS)}
              (role_objective_id, title, description)
            VALUES
              (${role_objective_id}, ${role.role}, ${role.description || role.role})
            RETURNING id
          `);
          sheet_id = insertedSheet?.[0]?.id;
        }

        updatedCount.sheets++;

        // === Handle KPIs ===
        for (const kpi of role.kpis || []) {
          if (!kpi?.kpi) continue;

          let kpi_id = kpi.id;

          let existingKpi = [];
          if (kpi_id) {
            existingKpi = await DB_Fetch(sql`
              SELECT id FROM ${sql.identifier(Tables.TBL_KPIS)}
              WHERE id = ${kpi_id} AND role_sheet_id = ${sheet_id}
              LIMIT 1
            `);
          }

          if (existingKpi?.length) {
            /* Update existing KPI */
            await DB_Insert(sql`
              UPDATE ${sql.identifier(Tables.TBL_KPIS)}
              SET name = ${kpi.kpi},
                  measurement = ${kpi.measure},
                  op_definition = ${kpi.operation_definition},
                  frequency = ${kpi.frequency_of_measurement || null},
                  chart_type = ${kpi.vcs || null},
                  updated_at = NOW()
              WHERE id = ${kpi_id}
            `);
          } else {
            /* Insert new KPI */
            await DB_Insert(sql`
              INSERT INTO ${sql.identifier(Tables.TBL_KPIS)}
                (role_sheet_id, name, measurement, op_definition, frequency, chart_type)
              VALUES
                (
                  ${sheet_id},
                  ${kpi.kpi},
                  ${kpi.measure},
                  ${kpi.operation_definition},
                  ${kpi.frequency_of_measurement || null},
                  ${kpi.vcs || null}
                )
            `);
          }

          updatedCount.kpis++;
        }
      }
    }

    return JsonResponse.success(updatedCount, "Role Sheet data updated successfully.");
  } catch (error) {
    console.error("[api/v1/roles/[role_id]/rs/[rs_id]/edit] Error:", error);
    return JsonResponse.error("Error while updating Role Sheet data", 500);
  }
}
