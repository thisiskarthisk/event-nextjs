import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function POST(req) {
  const { regn_no, event_id } = await req.json();

  const delegate = await DB_Fetch(`
    SELECT *
    FROM event_delegates
    WHERE LOWER(TRIM(regn_no)) = LOWER(TRIM('${regn_no}'))
    AND fkevent_id = ${event_id}
    LIMIT 1
  `);

  if (!delegate.length)
    return JsonResponse.error("Delegate not found");

  return JsonResponse.success(delegate[0]);
}
