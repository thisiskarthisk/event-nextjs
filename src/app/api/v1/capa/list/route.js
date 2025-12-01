import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET() {
  const result = await DB_Fetch(`
    SELECT
      ga.id AS ga_id,
      ga.capa_no as capa_no
    FROM
      gap_analysis ga
    WHERE ga.active = TRUE
  `);

  return JsonResponse.success({
    'gap_analysis': result,
  });
}
