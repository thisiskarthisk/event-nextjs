import { DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const { id } = await req.json();
    const RCAId = Number(id);

    if (!RCAId) {
      return JsonResponse.error("Invalid RCA ID.");
    }

    // -----------------------------------------
    // 1. Soft Delete RCA Master (main table)
    // -----------------------------------------
    const RcaTable =await DB_Insert(sql`
      UPDATE ${sql.identifier(Tables.TBL_RCA)}
      SET active = FALSE
      WHERE id = ${RCAId}
    `);

    // -----------------------------------------
    // 2. Soft Delete RCA Whys (child table)
    // -----------------------------------------
    if (RcaTable){
        await DB_Insert(sql`
            UPDATE ${sql.identifier(Tables.TBL_RCA_WHYS)}
            SET active = FALSE
            WHERE rca_id = ${RCAId}
        `);
    }
  

    return JsonResponse.success(
      { rca_id: RCAId },
      "The RCA record has been successfully deleted."
    );

  } catch (error) {
    console.error("[RCA DELETE] Error:", error);
    return JsonResponse.error("Error occurred when deleting RCA data.", 500);
  }
}

