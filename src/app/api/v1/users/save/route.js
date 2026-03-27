import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import bcrypt from "bcrypt";
import Validation from "@/helper/validation";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const data = await req.json();
    const isUpdate = !!data.id;
    
    let rules = {
      username: "required",
      user_type: "required",
      first_name: "required",
      last_name: "required",
      email: "required|email",
      mobile_no: "required|mobile_no"
    };

    if (!isUpdate) {
      rules.password = "required";
    }

    const dataForValidation = {
      username: data.username,
      user_type: data.user_type,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      mobile_no: data.mobile_no,
      password: data.password
    };

    const errors = Validation(dataForValidation, rules);
    
    if (errors && Object.keys(errors).length > 0) {
      return JsonResponse.error("Please correct the errors.", 422, errors);
    }

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    // --- 4. Handle UPDATE ---
    if (isUpdate) {
      await DB_Fetch(sql`
        UPDATE ${sql.identifier(Tables.TBL_USERS)}
        SET
          username    = ${data.username},
          user_type    = ${data.user_type},
          first_name  = ${data.first_name},
          last_name   = ${data.last_name},
          email       = ${data.email},
          mobile_no   = ${data.mobile_no},
          password    = COALESCE(${passwordHash}, password),
          updated_at  = NOW()
        WHERE id = ${Number(data.id)}
      `);

      return JsonResponse.success(
        { id: data.id },
        "The User has been updated successfully."
      );
    }

    const inserted = await DB_Insert(sql`
      INSERT INTO ${sql.identifier(Tables.TBL_USERS)}
        (username, user_type, first_name, last_name, email, mobile_no, password)
      VALUES
        (${data.username}, ${data.user_type}, ${data.first_name}, ${data.last_name}, ${data.email}, ${data.mobile_no}, ${passwordHash})
    `);

    return JsonResponse.success(
      { id: inserted },
      "The User has been created successfully."
    );
  } catch (error) {
    console.error("[api/users/save] Error:", error);

    let message = "Error occurred while saving user.";

    if (error.cause?.constraint) {
      if (error.cause.constraint.includes("unique_email"))
        message = "Email already used.";
      else if (error.cause.constraint.includes("unique_mobile_no"))
        message = "Mobile number already used.";
    }

    return JsonResponse.error(message);
  }
}