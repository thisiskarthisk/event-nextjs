import { DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const { id } = await req.json(); 

    const userId = Number(id);

    await DB_Insert(sql`
      UPDATE ${sql.identifier(Tables.TBL_USERS)}
      SET active = FALSE, updated_at = NOW()
      WHERE id = ${userId}
    `);

    return JsonResponse.success(
      { id: userId },
      "The User record has been deleted successfully."
    );

  } catch (error) {
    console.error(error);
    return JsonResponse.error(
      "Error occurred when trying to delete User data."
    );
  }
}
