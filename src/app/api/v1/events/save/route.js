import { DB_Fetch, DB_Insert, Tables } from "@/db";
import { JsonResponse } from "@/helper/api";
import { sql } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export async function POST(req) {
  try {

    // READ MULTIPART FORM
    const formData = await req.formData();

    // --------------------------------
    // Extract Fields
    // --------------------------------
    const id = formData.get("id");
    const isUpdate = !!id;

    const data = {
      event_name: formData.get("event_name"),
      event_description: formData.get("event_description"),
      event_start_datetime: formData.get("event_start_datetime"),
      event_end_datetime: formData.get("event_end_datetime"),
      event_organisation: formData.get("event_organisation") || null,
    };

    const file = formData.get("event_logo"); // File | null

    console.log("FORM DATA:", data, file);

    // --------------------------------
    // Helper to save uploaded file
    // --------------------------------
    const saveUploadedFile = async (file, folder) => {

      if (!file || typeof file === "string") return null;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/events",
        folder
      );

      await fs.mkdir(uploadDir, { recursive: true });

      const safeName =
        Date.now() + "-" + file.name.replace(/\s+/g, "");

      const fullPath = path.join(uploadDir, safeName);

      await fs.writeFile(fullPath, buffer);

      return `/uploads/events/${folder}/${safeName}`;
    };

    // ================================
    // UPDATE
    // ================================
    if (isUpdate) {

      const eventId = Number(id);

      const oldRows = await DB_Fetch(sql`
        SELECT event_logo
        FROM ${sql.identifier(Tables.TBL_EVENTS)}
        WHERE event_id = ${eventId}
      `);

      const oldLogo = oldRows?.[0]?.event_logo;

      let newLogoPath = null;

      if (file instanceof File) {

        newLogoPath = await saveUploadedFile(
          file,
          String(eventId)
        );

        // delete old logo
        if (oldLogo) {
          try {
            await fs.unlink(
              path.join(process.cwd(), "public", oldLogo)
            );
          } catch {}
        }
      }

      await DB_Fetch(sql`
        UPDATE ${sql.identifier(Tables.TBL_EVENTS)}
        SET
          event_name = ${data.event_name},
          event_description = ${data.event_description},
          event_start_datetime = ${data.event_start_datetime},
          event_end_datetime = ${data.event_end_datetime},
          event_organisation = ${data.event_organisation},
          event_logo = COALESCE(${newLogoPath}, event_logo),
          updated_at = NOW()
        WHERE event_id = ${eventId}
      `);

      return JsonResponse.success(
        { id: eventId },
        "Event updated successfully."
      );
    }

    // ================================
    // INSERT
    // ================================

    const insertedId = await DB_Insert(
      sql`
        INSERT INTO ${sql.identifier(Tables.TBL_EVENTS)}
        (
          event_name,
          event_description,
          event_start_datetime,
          event_end_datetime,
          event_organisation,
          active
        )
        VALUES (
          ${data.event_name},
          ${data.event_description},
          ${data.event_start_datetime},
          ${data.event_end_datetime},
          ${data.event_organisation},
          TRUE
        )
      `,
      "event_id"
    );

    if (file instanceof File) {

      const logoPath = await saveUploadedFile(
        file,
        String(insertedId)
      );

      await DB_Fetch(sql`
        UPDATE ${sql.identifier(Tables.TBL_EVENTS)}
        SET event_logo = ${logoPath}
        WHERE event_id = ${insertedId}
      `);
    }

    return JsonResponse.success(
      { id: insertedId },
      "Event created successfully."
    );

  } catch (err) {

    console.error("EVENT SAVE ERROR:", err);

    return JsonResponse.error(
      "Error occurred while saving Event data."
    );
  }
}
