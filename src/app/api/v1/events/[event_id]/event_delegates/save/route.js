import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { decodeURLParam } from "@/helper/utils";
import { sql } from "drizzle-orm";

export async function POST(req, context) {
  try {

    // =====================================================
    // EVENT ID
    // =====================================================
    const { event_id } = context.params;
    const eventId = Number(decodeURLParam(event_id));

    if (!eventId || isNaN(eventId)) {
      return JsonResponse.error("Invalid Event ID");
    }

    const body = await req.json();
    const id = body.id;
    const isUpdate = !!id;

    const data = {
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

    // =====================================================
    // UPDATE
    // =====================================================
    if (isUpdate) {

      const delegateId = Number(id);

      await DB_Fetch(sql`
        UPDATE ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
        SET
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
          AND fkevent_id = ${eventId}
      `);

      await DB_Fetch(sql`
        DELETE FROM ${sql.identifier(Tables.TBL_CUSTOM_FIELD_DELEGATES)}
        WHERE fkdelegates_id = ${delegateId}
      `);

      for (const row of customFields) {
        if (!row.label && !row.value) continue;

        await DB_Fetch(sql`
          INSERT INTO ${sql.identifier(Tables.TBL_CUSTOM_FIELD_DELEGATES)}
          (fkevent_id, fkdelegates_id, label, value)
          VALUES (
            ${eventId},
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

    // =====================================================
    // INSERT (EVENT + PREFIX BASED REGN NUMBERING)
    // =====================================================

    // 🔹 1. Get REGN setting for this event
    const Setting = await DB_Fetch(sql`
      SELECT value
      FROM ${sql.identifier(Tables.TBL_SETTINGS)}
      WHERE fkevent_id = ${eventId}
        AND setting_group = 'general'
        AND field_name = 'regn_no'
      LIMIT 1
    `);

    const settingValue = Setting?.[0]?.value || "";
    const [prefixRaw, digitsRaw] = settingValue.split(",");

    const prefix = prefixRaw?.trim().toUpperCase();
    const digits = Number(digitsRaw);

    if (!prefix || !digits) {
      return JsonResponse.error(
        "Registration No is not configured. Please set it in Settings page."
      );
    }

    // 🔹 2. Get max number ONLY for same event AND same prefix
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

    const regn_id = Number(lastNumberRow[0].max_number) + 1;

    const paddedId = String(regn_id).padStart(digits, "0");
    const REGN_no = `${prefix}${paddedId}`;

    // 🔹 3. Insert Delegate
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
          ${REGN_no},
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

    // 🔹 4. Insert Custom Fields
    for (const row of customFields) {
      if (!row.label && !row.value) continue;

      await DB_Fetch(sql`
        INSERT INTO ${sql.identifier(Tables.TBL_CUSTOM_FIELD_DELEGATES)}
        (fkevent_id, fkdelegates_id, label, value)
        VALUES (
          ${eventId},
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