import { DB_Fetch } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function GET(req, context) {
    const usersList = await DB_Fetch(`
        SELECT
            id as value,
            COALESCE( '['  || employee_id  ||  ']' || ' - ') || first_name || ' ' || COALESCE(last_name, '') AS label
        FROM users
        WHERE active = true
    `);

    return JsonResponse.success(usersList);
}