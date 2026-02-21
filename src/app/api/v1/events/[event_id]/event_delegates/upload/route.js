// export const runtime = "nodejs";

// import { DB_Fetch, DB_Insert, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";
// import { decodeURLParam } from "@/helper/utils";
// import { sql } from "drizzle-orm";
// import csv from "csv-parser";
// import { Readable } from "stream";

// /* ---------------- CSV PARSER ---------------- */

// async function parseCSV(buffer) {
//   return new Promise((resolve, reject) => {
//     const results = [];
//     const stream = Readable.from(buffer.toString());

//     stream
//       .pipe(csv())
//       .on("data", row => results.push(row))
//       .on("end", () => resolve(results))
//       .on("error", reject);
//   });
// }

// /* ---------------- HELPER ---------------- */

// function getVal(row, key) {
//   for (const k in row) {
//     if (k.trim().toLowerCase() === key.trim().toLowerCase()) {
//       return (row[k] || "").toString().trim();
//     }
//   }
//   return "";
// }

// /* ---------------- ROUTE ---------------- */

// // export async function POST(req, { params }) {
// export async function POST(req, context) {
//   try {

//     // ----------------------------------
//     // EVENT ID
//     // ----------------------------------
//     // const decoded = decodeURLParam(params.event_id);
//     // const eventId = Number(decoded);

//     const { event_id } = await context.params;    

//     const decoded = decodeURLParam(event_id);
//     const eventId = Number(decoded);

//     if (!eventId) {
//       return JsonResponse.error("Invalid Event ID");
//     }

//     // ----------------------------------
//     // REGN SETTING
//     // ----------------------------------
//     const setting = await DB_Fetch(sql`
//       SELECT value
//       FROM ${sql.identifier(Tables.TBL_SETTINGS)}
//       WHERE setting_group = 'general'
//         AND field_name = 'regn_no'
//       LIMIT 1
//     `);

//     const settingValue = setting?.[0]?.value;
//     // console.log("Regn No Setting:", settingValue);

//     if (!settingValue) {
//       return JsonResponse.error(
//         "Regn No is not configured. Please configure it in Settings page."
//       );
//     }

//     const [prefix, digitsStr] = settingValue.split(",");
//     const digits = Number(digitsStr);

//     if (!prefix || !digits) {
//       return JsonResponse.error("Invalid Regn No Setting. Regn No is not configured. Please set it in Settings page.");
//     }

//     // ----------------------------------
//     // FILE
//     // ----------------------------------
//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       return JsonResponse.error("CSV file missing.");
//     }

//     const buffer = Buffer.from(await file.arrayBuffer());
//     const rows = await parseCSV(buffer);

//     if (!rows.length) {
//       return JsonResponse.error("Empty CSV file");
//     }

//     // ----------------------------------
//     // VALIDATION
//     // ----------------------------------
//     const errors = {
//       missingFields: [],
//       csvDuplicates: [],
//       dbDuplicates: [],
//     };

//     const required = ["name", "phone_number"];

//     const phoneMap = {};

//     rows.forEach((r, idx) => {
//       const rowNo = idx + 2;

//       const phone = getVal(r, "phone_number");

//       // missing
//       const missing = [];
//       for (const field of required) {
//         if (!getVal(r, field)) missing.push(field);
//       }
//       if (missing.length) {
//         errors.missingFields.push({
//           row: rowNo,
//           missing,
//         });
//       }

//       // CSV dup
//       if (phone) {
//         phoneMap[phone] ??= [];
//         phoneMap[phone].push(rowNo);
//       }
//     });

//     Object.entries(phoneMap).forEach(([val, rows]) => {
//       if (rows.length > 1) {
//         rows.forEach(r =>
//           errors.csvDuplicates.push({
//             row: r,
//             field: "phone_number",
//             value: val,
//           })
//         );
//       }
//     });

//     if (
//       errors.missingFields.length ||
//       errors.csvDuplicates.length
//     ) {
//       return JsonResponse.error(
//         "Validation errors",
//         422,
//         {
//           type: "validation_errors",
//           errors,
//         }
//       );
//     }

//     // ----------------------------------
//     // LAST ID
//     // ----------------------------------
//     const last = await DB_Fetch(sql`
//       SELECT delegate_id
//       FROM ${sql.identifier(
//         Tables.TBL_EVENT_DELEGATES
//       )}
//       ORDER BY delegate_id DESC
//       LIMIT 1
//     `);

//     let nextId =
//       last.length > 0
//         ? Number(last[0].delegate_id) + 1
//         : 1;

//     // ----------------------------------
//     // INSERT
//     // ----------------------------------
//     for (const row of rows) {

//       const regnNo =
//         prefix +
//         String(nextId).padStart(digits, "0");

//       const insertedId = await DB_Insert(
//         sql`
//           INSERT INTO ${sql.identifier(
//             Tables.TBL_EVENT_DELEGATES
//           )}
//           (
//             fkevent_id,
//             regn_no,
//             name,
//             callname,
//             phone_number,
//             email,
//             club_name,
//             designation,
//             meal_type,
//             meals_per_event
//           )
//           VALUES (
//             ${eventId},
//             ${regnNo},
//             ${getVal(row, "name")},
//             ${getVal(row, "call_name") || null},
//             ${getVal(row, "phone_number")},
//             ${getVal(row, "email") || null},
//             ${getVal(row, "club_name") || null},
//             ${getVal(row, "designation") || null},
//             ${getVal(row, "meal_type") || null},
//             ${getVal(row, "meals_per_event") || null}
//           )
//         `,
//         "delegate_id"
//       );

//       // ----- CUSTOM FIELDS
//       for (const key of Object.keys(row)) {
//         if (key.startsWith("label")) {
//           const idx = key.replace("label", "");
//           const valKey = `value${idx}`;

//           await DB_Fetch(sql`
//             INSERT INTO ${sql.identifier(
//               Tables.TBL_CUSTOM_FIELD_DELEGATES
//             )}
//             (
//               fkevent_id,
//               fkdelegates_id,
//               label,
//               value
//             )
//             VALUES (
//               ${eventId},
//               ${insertedId},
//               ${row[key]},
//               ${row[valKey] || null}
//             )
//           `);
//         }
//       }

//       nextId++;
//     }

//     return JsonResponse.success(
//       {},
//       "Delegates uploaded successfully."
//     );

//   } catch (err) {

//     console.error("DELEGATE UPLOAD ERROR:", err);

//     return JsonResponse.error(
//       "Error uploading delegates."
//     );
//   }
// }



export const runtime = "nodejs";

import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { decodeURLParam } from "@/helper/utils";
import { sql } from "drizzle-orm";
import csv from "csv-parser";
import { Readable } from "stream";

/* ---------------- CSV PARSER ---------------- */

async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on("data", row => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

function getVal(row, key) {
  for (const k in row) {
    if (k.trim().toLowerCase() === key.trim().toLowerCase()) {
      return (row[k] || "").toString().trim();
    }
  }
  return "";
}

/* ---------------- ROUTE ---------------- */

export async function POST(req, context) {
  try {

    // =====================================================
    // EVENT ID
    // =====================================================
    const { event_id } = context.params;
    const eventId = Number(decodeURLParam(event_id));

    if (!eventId) {
      return JsonResponse.error("Invalid Event ID");
    }

    // =====================================================
    // REGN SETTING (EVENT BASED)
    // =====================================================
    const setting = await DB_Fetch(sql`
      SELECT value
      FROM ${sql.identifier(Tables.TBL_SETTINGS)}
      WHERE fkevent_id = ${eventId}
        AND setting_group = 'general'
        AND field_name = 'regn_no'
      LIMIT 1
    `);

    const settingValue = setting?.[0]?.value;

    if (!settingValue) {
      return JsonResponse.error(
        "Regn No is not configured. Please configure it in Settings page."
      );
    }

    const [prefixRaw, digitsRaw] = settingValue.split(",");
    const prefix = prefixRaw?.trim().toUpperCase();
    const digits = Number(digitsRaw);

    if (!prefix || !digits) {
      return JsonResponse.error(
        "Invalid Regn No Setting. Please configure properly."
      );
    }

    // =====================================================
    // FILE
    // =====================================================
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return JsonResponse.error("CSV file missing.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = await parseCSV(buffer);

    if (!rows.length) {
      return JsonResponse.error("Empty CSV file");
    }

    // =====================================================
    // VALIDATION
    // =====================================================
    const errors = {
      missingFields: [],
      csvDuplicates: [],
    };

    const required = ["name", "phone_number"];
    const phoneMap = {};

    rows.forEach((r, idx) => {
      const rowNo = idx + 2;
      const phone = getVal(r, "phone_number");

      const missing = [];
      for (const field of required) {
        if (!getVal(r, field)) missing.push(field);
      }

      if (missing.length) {
        errors.missingFields.push({ row: rowNo, missing });
      }

      if (phone) {
        phoneMap[phone] ??= [];
        phoneMap[phone].push(rowNo);
      }
    });

    Object.entries(phoneMap).forEach(([val, rows]) => {
      if (rows.length > 1) {
        rows.forEach(r =>
          errors.csvDuplicates.push({
            row: r,
            field: "phone_number",
            value: val,
          })
        );
      }
    });

    if (errors.missingFields.length || errors.csvDuplicates.length) {
      return JsonResponse.error("Validation errors", 422, {
        type: "validation_errors",
        errors,
      });
    }

    // =====================================================
    // 🔥 GET CURRENT MAX NUMBER FOR SAME EVENT + PREFIX
    // =====================================================
    const lastNumberRow = await DB_Fetch(sql`
      SELECT
        COALESCE(
          MAX(
            CAST(
              REGEXP_REPLACE(regn_no, '\\D', '', 'g')
              AS INTEGER
            )
          ),
          0
        ) AS max_number
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE fkevent_id = ${eventId}
        AND regn_no ILIKE ${prefix + '%'}
    `);

    let nextNumber = Number(lastNumberRow[0].max_number) + 1;

    // =====================================================
    // INSERT LOOP
    // =====================================================
    for (const row of rows) {

      const regnNo =
        prefix +
        String(nextNumber).padStart(digits, "0");

      const insertedId = await DB_Insert(
        sql`
          INSERT INTO ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
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
            ${eventId},
            ${regnNo},
            ${getVal(row, "name")},
            ${getVal(row, "call_name") || null},
            ${getVal(row, "phone_number")},
            ${getVal(row, "email") || null},
            ${getVal(row, "club_name") || null},
            ${getVal(row, "designation") || null},
            ${getVal(row, "meal_type") || null},
            ${getVal(row, "meals_per_event") || null}
          )
        `,
        "delegate_id"
      );

      // ----- CUSTOM FIELDS
      for (const key of Object.keys(row)) {
        if (key.startsWith("label")) {
          const idx = key.replace("label", "");
          const valKey = `value${idx}`;

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
              ${eventId},
              ${insertedId},
              ${row[key]},
              ${row[valKey] || null}
            )
          `);
        }
      }

      nextNumber++;
    }

    return JsonResponse.success(
      {},
      "Delegates uploaded successfully."
    );

  } catch (err) {

    console.error("DELEGATE UPLOAD ERROR:", err);

    return JsonResponse.error(
      "Error uploading delegates."
    );
  }
}