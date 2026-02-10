import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { decodeURLParam } from "@/helper/utils";
import { sql } from "drizzle-orm";

export async function POST(req, { params }) {
  try {
    // ------------------------
    // EVENT ID FROM ROUTE
    // ------------------------
    const decoded = decodeURLParam(params.event_id);
    const eventId = Number(decoded);

    if (!eventId || isNaN(eventId)) {
      return JsonResponse.error("Invalid Event ID");
    }

    // ------------------------
    // BODY
    // ------------------------
    const body = await req.json();

    const delegateId = body.id ? Number(body.id) : null;
    const isUpdate = !!delegateId;

    const data = {
      fkevent_id: eventId,
      activity_name: body.activity_name || null,
      description: body.description || null,
      start_datetime: body.start_datetime || null,
      end_datetime: body.end_datetime || null,
      activity_category: body.activity_category || null,
      meal_type: body.meal_type || null,
      multiple_allowed: body.multiple_allowed ? true : false,
    };

    // ------------------------
    // MEAL TYPE RULE
    // ------------------------
    const finalMealType =
      data.activity_category === "food"
        ? data.meal_type || null
        : null;

    // ------------------------
    // UPDATE
    // ------------------------
    if (isUpdate) {
      await DB_Fetch(sql`
        UPDATE ${sql.identifier(Tables.TBL_EVENT_ACTIVITIES)}
        SET
          fkevent_id = ${data.fkevent_id},
          activity_name = ${data.activity_name},
          description = ${data.description},
          start_datetime = ${data.start_datetime},
          end_datetime = ${data.end_datetime},
          activity_category = ${data.activity_category},
          meal_type = ${finalMealType},
          multiple_allowed = ${data.multiple_allowed},
          updated_at = NOW()
        WHERE event_activity_id = ${delegateId}
      `);

      return JsonResponse.success(
        { id: delegateId },
        "Activity updated successfully."
      );
    }

    // ------------------------
    // INSERT
    // ------------------------
    const inserted = await DB_Insert(
      sql`
        INSERT INTO ${sql.identifier(Tables.TBL_EVENT_ACTIVITIES)}
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
        VALUES (
          ${eventId},
          ${data.activity_name},
          ${data.description},
          ${data.start_datetime},
          ${data.end_datetime},
          ${data.activity_category},
          ${finalMealType},
          ${data.multiple_allowed}
        )
      `,
      "event_activity_id"
    );

    return JsonResponse.success(
      { id: inserted },
      "Activity created successfully."
    );

  } catch (err) {
    console.error("EVENT ACTIVITY SAVE ERROR >>>", err);

    return JsonResponse.error("Error saving Event Activity.");
  }
}
