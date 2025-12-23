import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type");

        let rows;

        switch (type) {
            case "userList":
                rows = await DB_Fetch(sql`
                    SELECT id AS value,
                    CASE
                        WHEN employee_id IS NULL OR employee_id = ''
                        THEN CONCAT(first_name, ' ', last_name)
                        ELSE CONCAT('[ ', employee_id, ' ] ', first_name, ' ', last_name)
                    END AS label
                    FROM ${sql.identifier(Tables.TBL_USERS)}
                    WHERE active = TRUE
                    ORDER BY user_type DESC,id ASC
                `);
                break;

            default:
                return JsonResponse.error(
                    "Invalid request type",
                    400
                );
        }

        return JsonResponse.success(
            rows,
            "Data fetched successfully"
        );


    } catch (error) {
        console.error("[DROPDOWN] Error:", error);
        return JsonResponse.error(
            "Server error",
            500
        );
    }
}
