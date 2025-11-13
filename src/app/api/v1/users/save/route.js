import { DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import bcrypt from 'bcrypt';
import Validation from "@/helper/validation";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const data = await req.json();

    const errors = Validation(data, {
      'employee_id': 'required|alpha_num',
      'first_name': 'required',
      'last_name': 'required',
      'email': 'required|email',
      'mobile_no': 'required|mobile_no',
      'password': 'required',
    });

    if (errors && Object.keys(errors).length > 0) {
      return JsonResponse.error('There are some invalid inputs found. Please correct them all to continue', 422, {
        'errors': errors,
      })
    }

    const password = await bcrypt.hash(data.password, 10);

    const insertedRow = await DB_Insert(sql`
      INSERT INTO ${sql.identifier(Tables.TBL_USERS)}
        (employee_id, first_name, last_name, email, mobile_no, password)
      VALUES
        (${data.employee_id}, ${data.first_name}, ${data.last_name}, ${data.email}, ${data.mobile_no}, ${password})
    `);

    return JsonResponse.success({
      'insertedRow': insertedRow,
    }, 'The User has been created successfully.');
  } catch (error) {
    console.error('[api/users/save] Error:', error);

    let message = 'Error occurred when trying to save User data.';

    if (error.cause && error.cause.constraint) {
      if (error.cause.constraint.includes('unique_employee_id')) {
        message = 'The given employee ID has already been taken.';
      } else if (error.cause.constraint.includes('unique_email')) {
        message = 'The given email address has already been used.';
      } else if (error.cause.constraint.includes('unique_mobile_no')) {
        message = 'The given mobile number has already been used.';
      }
    }

    return JsonResponse.error(message);
  }
}
