// import { DB_Fetch, DB_Insert, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";
// import { sql } from "drizzle-orm";

// export async function POST(req) {
//   try {

//     // =============================
//     // READ MULTIPART FORM
//     // =============================
//     const formData = await req.formData();

//     const id = formData.get("id");
//     const isUpdate = !!id;

//     // =============================
//     // MAIN TABLE DATA
//     // =============================
//     const data = {
//       fkevent_id: Number(formData.get("event_id")),
//       regn_no: formData.get("regn_no") || null,
//       name: formData.get("name"),
//       callname: formData.get("callname") || null,
//       phone_number: formData.get("phone_number") || null,
//       email: formData.get("email") || null,
//       club_name: formData.get("club_name") || null,
//       designation: formData.get("designation") || null,
//       meal_type: formData.get("meal_type") || null,
//       meals_per_event: Number(
//         formData.get("meals_per_event") || 0
//       ),
//     };

//     // =============================
//     // CUSTOM FIELDS (JSON STRING)
//     // =============================
//     let customFields = [];

//     const customStr = formData.get("custom_fields");

//     if (customStr) {
//       try {
//         customFields = JSON.parse(customStr);
//       } catch {
//         customFields = [];
//       }
//     }

//     // =============================
//     // UPDATE
//     // =============================
//     if (isUpdate) {

//       const delegateId = Number(id);

//       await DB_Fetch(sql`
//         UPDATE ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
//         SET
//           regn_no = ${data.regn_no},
//           name = ${data.name},
//           callname = ${data.callname},
//           phone_number = ${data.phone_number},
//           email = ${data.email},
//           club_name = ${data.club_name},
//           designation = ${data.designation},
//           meal_type = ${data.meal_type},
//           meals_per_event = ${data.meals_per_event},
//           updated_at = NOW()
//         WHERE delegate_id = ${delegateId}
//       `);

//       // ----------------------------------
//       // REMOVE OLD CUSTOM FIELDS
//       // ----------------------------------
//       await DB_Fetch(sql`
//         DELETE FROM ${sql.identifier(
//           Tables.TBL_CUSTOM_FIELD_DELEGATES
//         )}
//         WHERE fkdelegates_id = ${delegateId}
//       `);

//       // ----------------------------------
//       // INSERT NEW CUSTOM FIELDS
//       // ----------------------------------
//       for (const row of customFields) {

//         if (!row.label && !row.value) continue;

//         await DB_Fetch(sql`
//           INSERT INTO ${sql.identifier(
//             Tables.TBL_CUSTOM_FIELD_DELEGATES
//           )}
//           (
//             fkevent_id,
//             fkdelegates_id,
//             label,
//             value
//           )
//           VALUES (
//             ${data.fkevent_id},
//             ${delegateId},
//             ${row.label || null},
//             ${row.value || null}
//           )
//         `);
//       }

//       return JsonResponse.success(
//         { id: delegateId },
//         "Delegate updated successfully."
//       );
//     }

//     // =============================
//     // INSERT
//     // =============================

//     const insertedId = await DB_Insert(
//       sql`
//         INSERT INTO ${sql.identifier(
//           Tables.TBL_EVENT_DELEGATES
//         )}
//         (
//           fkevent_id,
//           regn_no,
//           name,
//           callname,
//           phone_number,
//           email,
//           club_name,
//           designation,
//           meal_type,
//           meals_per_event
//         )
//         VALUES (
//           ${data.fkevent_id},
//           ${data.regn_no},
//           ${data.name},
//           ${data.callname},
//           ${data.phone_number},
//           ${data.email},
//           ${data.club_name},
//           ${data.designation},
//           ${data.meal_type},
//           ${data.meals_per_event}
//         )
//       `,
//       "delegate_id"
//     );

//     // ----------------------------------
//     // INSERT CUSTOM FIELDS
//     // ----------------------------------
//     for (const row of customFields) {

//       if (!row.label && !row.value) continue;

//       await DB_Fetch(sql`
//         INSERT INTO ${sql.identifier(
//           Tables.TBL_CUSTOM_FIELD_DELEGATES
//         )}
//         (
//           fkevent_id,
//           fkdelegates_id,
//           label,
//           value
//         )
//         VALUES (
//           ${data.fkevent_id},
//           ${insertedId},
//           ${row.label || null},
//           ${row.value || null}
//         )
//       `);
//     }

//     return JsonResponse.success(
//       { id: insertedId },
//       "Delegate created successfully."
//     );

//   } catch (err) {

//     console.error("DELEGATE SAVE ERROR:", err);

//     return JsonResponse.error(
//       "Error occurred while saving Delegate data."
//     );
//   }
// }




import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {

    // ============================
    // READ JSON BODY
    // ============================
    const body = await req.json();

    const id = body.id;
    const isUpdate = !!id;

    // ============================
    // MAIN DATA
    // ============================
    const data = {
      fkevent_id: Number(body.event_id),
      regn_no: body.regn_no || null,
      name: body.name,
      callname: body.callname || null,
      phone_number: body.phone_number || null,
      email: body.email || null,
      club_name: body.club_name || null,
      designation: body.designation || null,
      meal_type: body.meal_type || null,
      meals_per_event: Number(body.meals_per_event || 0),
    };

    const customFields = body.custom_fields || [];

    // ============================
    // UPDATE
    // ============================
    if (isUpdate) {

      const delegateId = Number(id);

      await DB_Fetch(sql`
        UPDATE ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
        SET
          regn_no = ${data.regn_no},
          name = ${data.name},
          callname = ${data.callname},
          phone_number = ${data.phone_number},
          email = ${data.email},
          club_name = ${data.club_name},
          designation = ${data.designation},
          meal_type = ${data.meal_type},
          meals_per_event = ${data.meals_per_event},
          updated_at = NOW()
        WHERE delegate_id = ${delegateId}
      `);

      // delete old custom fields
      await DB_Fetch(sql`
        DELETE FROM ${sql.identifier(
          Tables.TBL_CUSTOM_FIELD_DELEGATES
        )}
        WHERE fkdelegates_id = ${delegateId}
      `);

      // insert new custom fields
      for (const row of customFields) {

        if (!row.label && !row.value) continue;

        await DB_Fetch(sql`
          INSERT INTO ${sql.identifier(
            Tables.TBL_CUSTOM_FIELD_DELEGATES
          )}
          (
            fkevent_id,
            fkdelegates_id,
            label,
            value
          )
          VALUES (
            ${data.fkevent_id},
            ${delegateId},
            ${row.label || null},
            ${row.value || null}
          )
        `);
      }

      return JsonResponse.success(
        { id: delegateId },
        "Delegate updated successfully."
      );
    }

    // ============================
    // INSERT
    // ============================

    const insertedId = await DB_Insert(
      sql`
        INSERT INTO ${sql.identifier(
          Tables.TBL_EVENT_DELEGATES
        )}
        (
          fkevent_id,
          regn_no,
          name,
          callname,
          phone_number,
          email,
          club_name,
          designation,
          meal_type,
          meals_per_event
        )
        VALUES (
          ${data.fkevent_id},
          ${data.regn_no},
          ${data.name},
          ${data.callname},
          ${data.phone_number},
          ${data.email},
          ${data.club_name},
          ${data.designation},
          ${data.meal_type},
          ${data.meals_per_event}
        )
      `,
      "delegate_id"
    );

    // insert custom fields
    for (const row of customFields) {

      if (!row.label && !row.value) continue;

      await DB_Fetch(sql`
        INSERT INTO ${sql.identifier(
          Tables.TBL_CUSTOM_FIELD_DELEGATES
        )}
        (
          fkevent_id,
          fkdelegates_id,
          label,
          value
        )
        VALUES (
          ${data.fkevent_id},
          ${insertedId},
          ${row.label || null},
          ${row.value || null}
        )
      `);
    }

    return JsonResponse.success(
      { id: insertedId },
      "Delegate created successfully."
    );

  } catch (err) {

    console.error("DELEGATE SAVE ERROR:", err);

    return JsonResponse.error(
      "Error occurred while saving Delegate data."
    );
  }
}
