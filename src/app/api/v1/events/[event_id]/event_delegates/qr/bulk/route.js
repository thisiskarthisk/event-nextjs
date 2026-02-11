export const runtime = "nodejs";

import QRCode from "qrcode";
import archiver from "archiver";
import { PassThrough } from "stream";
import { DB_Fetch, Tables } from "@/db";
import { sql } from "drizzle-orm";
import { decodeURLParam } from "@/helper/utils";

function sanitize(name) {
  return name
    ?.toString()
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
}

export async function GET(req, context) {
  try {

    const { event_id } = await context.params;
    const decoded = decodeURLParam(event_id);
    const eventId = Number(decoded);

    if (!eventId) {
      return new Response("Invalid Event ID", { status: 400 });
    }

    // --------------------------------
    // Fetch ALL delegates
    // --------------------------------
    const delegates = await DB_Fetch(sql`
      SELECT
        delegate_id,
        regn_no,
        name,
        phone_number,
        email
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE fkevent_id = ${eventId}
      ORDER BY delegate_id ASC
    `);

    if (!delegates.length) {
      return new Response("No delegates found", { status: 404 });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();
    archive.pipe(stream);

    const usedNames = new Set();

    for (const d of delegates) {

      const qrText =
        `REGNO:${d.regn_no || ""}\n` +
        `NAME:${d.name || ""}\n` +
        `PHONE:${d.phone_number || ""}\n` +
        `EMAIL:${d.email || ""}`;

      const buffer = await QRCode.toBuffer(qrText, {
        width: 600,
        margin: 2,
      });

      // --------------------------------
      // FILE NAME PRIORITY LOGIC
      // --------------------------------

      let finalName;

      // ✅ 1️⃣ Priority → REGN_NO
      if (d.regn_no && d.regn_no.trim() !== "") {
        finalName = sanitize(d.regn_no);
      }
      else {
        // ✅ 2️⃣ If no regn_no → use name
        let baseName = sanitize(d.name);

        if (!baseName) {
          baseName = `delegate_${d.delegate_id}`;
        }

        finalName = baseName;

        // ✅ If duplicate name
        if (usedNames.has(finalName)) {
          if (d.phone_number) {
            finalName = `${baseName}_${d.phone_number}`;
          } else {
            finalName = `${baseName}_${d.delegate_id}`;
          }
        }
      }

      usedNames.add(finalName);

      archive.append(buffer, {
        name: `${finalName}.png`,
      });
    }

    await archive.finalize();

    return new Response(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          `attachment; filename=event-${eventId}-delegates-qr.zip`,
      },
    });

  } catch (err) {
    console.error("BULK QR ERROR:", err);
    return new Response("Server Error", { status: 500 });
  }
}
