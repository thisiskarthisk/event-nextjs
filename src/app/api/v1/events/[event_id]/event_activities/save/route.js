import { DB_Fetch, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      id,
      event_id, // 👈 parent event id
      activity_name,
      description,
      start_datetime,
      end_datetime,
      activity_category,
      meal_type,
      multiple_allowed,
    } = body;

    if (
      !event_id ||
      !activity_name ||
      !start_datetime ||
      !end_datetime ||
      !activity_category
    ) {
      return JsonResponse.error(
        "Missing required fields."
      );
    }

    // 👇 only allow meal_type if category = food
    const finalMealType =
      activity_category === "food"
        ? meal_type || null
        : null;

    // -----------------------
    // UPDATE
    // -----------------------
    if (id) {
      await DB_Fetch(`
        UPDATE ${Tables.TBL_EVENT_ACTIVITIES}
        SET
          fkevent_id = ${event_id},
          activity_name = '${activity_name}',
          description = '${description || ""}',
          start_datetime = '${start_datetime}',
          end_datetime = '${end_datetime}',
          activity_category = '${activity_category}',
          meal_type = ${
            finalMealType
              ? `'${finalMealType}'`
              : "NULL"
          },
          multiple_allowed = ${multiple_allowed}
        WHERE event_activity_id = ${id}
      `);

      return JsonResponse.success(
        { id },
        "Activity updated successfully."
      );
    }

    // -----------------------
    // INSERT
    // -----------------------
    const result = await DB_Fetch(`
      INSERT INTO ${Tables.TBL_EVENT_ACTIVITIES}
      (
        fkevent_id,
        activity_name,
        description,
        start_datetime,
        end_datetime,
        activity_category,
        meal_type,
        multiple_allowed
      )
      VALUES
      (
        ${event_id},
        '${activity_name}',
        '${description || ""}',
        '${start_datetime}',
        '${end_datetime}',
        '${activity_category}',
        ${
          finalMealType
            ? `'${finalMealType}'`
            : "NULL"
        },
        ${multiple_allowed}
      )
      RETURNING event_activity_id
    `);

    return JsonResponse.success(
      { id: result[0].event_activity_id },
      "Activity created successfully."
    );

  } catch (err) {
    console.error(
      "EVENT ACTIVITY SAVE ERROR >>>",
      err
    );

    return JsonResponse.error(
      "Error saving Event Activity."
    );
  }
}



// import { DB_Fetch, Tables } from "@/db";
// import { JsonResponse } from "@/helper/api";

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const {
//       id, event_id, activity_name, description, start_datetime,
//       end_datetime, activity_category, meal_type, multiple_allowed
//     } = body;

//     if (!event_id || !activity_name || !start_datetime || !end_datetime || !activity_category) {
//       return JsonResponse.error("Missing required fields.");
//     }

//     const finalMealType = activity_category === "food" ? meal_type || null : null;

//     if (id) {
//       // UPDATE (use params if DB_Fetch supports)
//       await DB_Fetch(`
//         UPDATE ${Tables.TBL_EVENT_ACTIVITIES}
//         SET fkevent_id = ${event_id},
//             activity_name = '${activity_name}',
//             description = '${description || ""}',
//             start_datetime = '${start_datetime}',
//             end_datetime = '${end_datetime}',
//             activity_category = '${activity_category}',
//             meal_type = ${finalMealType ? `'${finalMealType}'` : "NULL"},
//             multiple_allowed = ${multiple_allowed}
//         WHERE event_activity_id = ${id}
//       `);
//       return JsonResponse.success({ id }, "Activity updated successfully.");
//     }

//     // INSERT
//     const result = await DB_Fetch(`
//       INSERT INTO ${Tables.TBL_EVENT_ACTIVITIES}
//       (fkevent_id, activity_name, description, start_datetime, end_datetime,
//        activity_category, meal_type, multiple_allowed)
//       VALUES (${event_id}, '${activity_name}', '${description || ""}',
//               '${start_datetime}', '${end_datetime}', '${activity_category}',
//               ${finalMealType ? `'${finalMealType}'` : "NULL"}, ${multiple_allowed})
//       RETURNING event_activity_id
//     `);

//     return JsonResponse.success({ id: result[0].event_activity_id }, "Activity created successfully.");
//   } catch (err) {
//     console.error("EVENT ACTIVITY SAVE ERROR >>>", err);
//     return JsonResponse.error("Error saving Event Activity.");
//   }
// }

// export async function GET(req) {
//   const id = req.nextUrl.searchParams.get("id");
//   const activityId = Number(id);

//   if (!id || isNaN(activityId)) {
//     return JsonResponse.error("Activity ID is required.");
//   }

//   const rows = await DB_Fetch(`
//     SELECT * FROM ${Tables.TBL_EVENT_ACTIVITIES}
//     WHERE active = TRUE AND event_activity_id = ${activityId}
//     LIMIT 1
//   `);

//   return JsonResponse.success(rows[0] || {});
// }
