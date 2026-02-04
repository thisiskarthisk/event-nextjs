import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function GET(req) {
    try{
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get("user_id");
        if (!user_id) {
            return JsonResponse.error("Missing user_id parameter", 400);
        }

        // const result = await DB_Fetch(`
        //     SELECT 
        //         usr.id,
        //         usr.first_name,
        //         usr.last_name,
        //         usr.email,
        //         usr.user_type,
        //         usrole.role_id,
        //         role.name as role_name
        //     FROM ${Tables.TBL_USERS} usr
        //     LEFT JOIN ${Tables.TBL_ROLE_USERS} usrole
        //     ON usr.id = usrole.user_id
        //         AND usrole.active = TRUE
        //     LEFT JOIN ${Tables.TBL_ROLES} role
        //     ON usrole.role_id = role.id
        //     AND role.active = TRUE
        //     WHERE usr.id = ${user_id}
        //     AND usr.active = TRUE
            
        //     ;
        // `);

        return JsonResponse.success({
            'user': result && result.length > 0 ? result[0] : null,
        });
    }catch(e){
        console.error("[api/auth/user] Error:", e);
        return JsonResponse.error("Error occurred when trying to GET user record.");
    }
}