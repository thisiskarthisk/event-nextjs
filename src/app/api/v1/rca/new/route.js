import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET() {
  const gap_analysis = await DB_Fetch(`
    SELECT
      *
    FROM
      gap_analysis ga
  `);

  const cp_actions = await DB_Fetch(sql`
        SELECT
            ga.id AS ga_id,
            cpa.id AS cpa_id,
            ga.*,
            cpa.*,
            CASE
                WHEN cpa.cor_action_responsibility IS NULL THEN NULL
                ELSE CONCAT(u_cor.first_name, ' ', u_cor.last_name)
            END AS cor_responsibility_user,
            CASE
                WHEN cpa.prev_action_responsibility IS NULL THEN NULL
                ELSE CONCAT(u_prev.first_name, ' ', u_prev.last_name)
            END AS prev_responsibility_user
        FROM
            ${sql.identifier(Tables.TBL_GAP_ANALYSIS)} ga

        LEFT JOIN ${sql.identifier(Tables.TBL_CP_ACTIONS)} cpa
        ON ga.id = cpa.gap_analysis_id

        LEFT JOIN ${sql.identifier(Tables.TBL_USERS)} u_cor
            ON u_cor.id = cpa.cor_action_responsibility

        LEFT JOIN ${sql.identifier(Tables.TBL_USERS)} u_prev
            ON u_prev.id = cpa.prev_action_responsibility
        WHERE
        ga.active = true AND cpa.active = true;
  `);

  return JsonResponse.success({
    'gap_analysis_list': gap_analysis,
    'cp_actions': cp_actions,
  });
}