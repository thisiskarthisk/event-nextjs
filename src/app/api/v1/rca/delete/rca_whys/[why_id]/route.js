import { DB_Insert, DB_Update, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req, context) {
  try {
    const { why_id } = await context.params;
    // console.log("why_id", why_id);

    // const { id } = await req.json();
    const RCA_WhysId = Number(why_id);

    await DB_Update(Tables.TBL_RCA_WHYS,{active:false},RCA_WhysId);

    return JsonResponse.success(
      { rca_why_id: RCA_WhysId },
      "The RCA record has been successfully deleted."
    );

  } catch (error) {
    console.error("[RCA WHY DELETE] Error:", error);
    return JsonResponse.error("Error occurred when deleting RCA WHY data.", 500);
  }
}

