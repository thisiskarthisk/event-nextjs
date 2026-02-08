import { DB_Fetch, Tables } from "@/db"; // use generic query runner
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const res = await req.json();
    const { id } = res;
    const EventActivityId = Number(id);

    if (!EventActivityId) {
      return JsonResponse.error("Invalid Event Activity ID");
    }

    await DB_Fetch(sql`
      UPDATE ${sql.identifier(Tables.TBL_EVENT_ACTIVITIES)}
      SET active = FALSE,
          updated_at = NOW()
      WHERE event_activity_id = ${EventActivityId}
    `);

    return JsonResponse.success(
      { id: EventActivityId },
      "The Event Activity record has been deleted successfully."
    );

  } catch (error) {
    console.error("DELETE EVENT ACTIVITY ERROR >>>", error);

    return JsonResponse.error(
      "Error occurred when trying to delete Event Activity data."
    );
  }
}
