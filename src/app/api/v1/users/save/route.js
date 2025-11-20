import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import bcrypt from "bcrypt";
import Validation from "@/helper/validation";
import { sql } from "drizzle-orm";
export async function POST(req) {
  try {
    const data = await req.json();
    const isUpdate = !!data.id;

    const rules = {
      employee_id: "required|alpha_num",
      first_name: "required",
      last_name: "required",
      email: "required|email",
      mobile_no: "required|mobile_no"
    };

    if (!isUpdate) {
      rules.password = "required";
    }

    const errors = Validation(data, rules);

    if (errors && Object.keys(errors).length > 0) {
      return JsonResponse.error("Please correct the errors.", 422, errors);
    }

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    // UPDATE
    if (isUpdate) {
      await DB_Fetch(sql`
        UPDATE ${sql.identifier(Tables.TBL_USERS)}
        SET
          employee_id = ${data.employee_id},
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

    // INSERT (NO RETURNING)
    const inserted = await DB_Insert(sql`
      INSERT INTO ${sql.identifier(Tables.TBL_USERS)}
        (employee_id, first_name, last_name, email, mobile_no, password)
      VALUES
        (${data.employee_id}, ${data.first_name}, ${data.last_name}, ${data.email}, ${data.mobile_no}, ${passwordHash})
    `);

    return JsonResponse.success(
      { id: inserted },
      "The User has been created successfully."
    );
  } catch (error) {
    console.error("[api/users/save] Error:", error);

    let message = "Error occurred while saving user.";

    if (error.cause?.constraint) {
      if (error.cause.constraint.includes("unique_employee_id"))
        message = "Employee ID already taken.";
      else if (error.cause.constraint.includes("unique_email"))
        message = "Email already used.";
      else if (error.cause.constraint.includes("unique_mobile_no"))
        message = "Mobile number already used.";
    }

    return JsonResponse.error(message);
  }
}
