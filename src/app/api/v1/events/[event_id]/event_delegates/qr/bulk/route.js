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

    /* --------------------------
       FETCH ALL ACTIVE DELEGATES
    ---------------------------*/
    const delegates = await DB_Fetch(sql`
      SELECT delegate_id, regn_no, name, phone_number, email
      FROM ${sql.identifier(Tables.TBL_EVENT_DELEGATES)}
      WHERE fkevent_id = ${eventId}
        AND active = TRUE
      ORDER BY delegate_id ASC
    `);

    if (!delegates.length) {
      return new Response("No delegates found", { status: 404 });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();
    archive.pipe(stream);

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

      let filename = d.regn_no
        ? sanitize(d.regn_no)
        : sanitize(d.name) || `delegate_${d.delegate_id}`;

      archive.append(buffer, {
        name: `${filename}.png`,
      });
    }

    await archive.finalize();

    return new Response(stream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          `attachment; filename=event-${eventId}-all-qr.zip`,
      },
    });

  } catch (err) {
    console.error("BULK QR ERROR:", err);
    return new Response("Server Error", { status: 500 });
  }
}

