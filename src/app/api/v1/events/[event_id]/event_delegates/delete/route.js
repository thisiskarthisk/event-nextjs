import { DB_Fetch, Tables } from "@/db"; 
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const res = await req.json();
    const { id } = res; 
    const delegateId = Number(id);

    if (!delegateId) {
      return JsonResponse.error("Invalid Delegate ID");
    }

    // Soft delete: updates active status and timestamp
    await DB_Fetch(sql`
      UPDATE ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      SET active = FALSE,
          updated_at = NOW()
      WHERE delegate_id = ${delegateId}
    `);

    return JsonResponse.success(
      { id: delegateId },
      "The Event Delegate record has been deleted successfully."
    );

  } catch (error) {
    console.error("DELETE EVENT DELEGATE ERROR >>>", error);
    return JsonResponse.error("Error occurred while deleting data.");
  }
}