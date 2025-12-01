import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {
  const result = await DB_Fetch(`
    SELECT
      *
    FROM
      root_cause_analysis rca
    WhERE rca.active = TRUE
    ORDER BY rca.id ASC
  `);

  return JsonResponse.success({
    'root_cause_analysis': result,
  });
}
