import { DB_Fetch, Tables } from "@/db"; // use generic query runner
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const res = await req.json();
    // console.log("DELETE res:", res);
    const { id } = res;
    const EventId = Number(id);

    if (!EventId) {
      return JsonResponse.error("Invalid Event ID");
    }

    // console.log("Deleting Event:", EventId);

    await DB_Fetch(sql`
      UPDATE ${sql.identifier(Tables.TBL_EVENTS)}
      SET active = FALSE,
          updated_at = NOW()
      WHERE event_id = ${EventId}
    `);

    return JsonResponse.success(
      { id: EventId },
      "The Event record has been deleted successfully."
    );

  } catch (error) {
    console.error("DELETE EVENT ERROR >>>", error);

    return JsonResponse.error(
      "Error occurred when trying to delete Event data."
    );
  }
}



