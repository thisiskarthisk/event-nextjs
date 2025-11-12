import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {
  const gap_analysis = await DB_Fetch(`
    SELECT
      *
    FROM
      gap_analysis ga
  `);

  const cp_actions = await DB_Fetch(`
        SELECT
            ga.id AS ga_id,
            cpa.id AS cpa_id,
            ga.*,
            cpa.*
        FROM
            gap_analysis ga
        LEFT JOIN cp_actions cpa
        ON ga.id = cpa.gap_analysis_id;
  `);

  return JsonResponse.success({
    'gap_analysis_list': gap_analysis,
    'cp_actions': cp_actions,
  });
}